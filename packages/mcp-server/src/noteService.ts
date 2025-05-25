import fs from "fs/promises";
import path from "path";
import os from "os";
import matter from "gray-matter";
import { searchService } from "./searchService.js";
import { extractOutgoingLinks, LinkRelationship } from "./noteLinkService.js";

export const NOTES_DIR =
  process.env.NODE_ENV === "test"
    ? path.join(os.tmpdir(), "notetaker-mcp-test", "notes")
    : path.join(os.homedir(), ".notetaker-mcp", "notes");

// Reserved system fields that users cannot override
const RESERVED_FIELDS = ["title", "createdAt", "updatedAt"];

// Note type definition
export interface Note {
  title: string;
  content: string; // Raw file content including frontmatter
}

// Enhanced Note with link information
export interface NoteWithLinks extends Note {
  outgoingLinks: string[];
  backlinks: string[];
}

// In-memory link tracking
class LinkTracker {
  private relationships: Map<string, Set<string>> = new Map(); // fromNote -> Set<toNote>
  private backlinks: Map<string, Set<string>> = new Map(); // toNote -> Set<fromNote>

  updateNoteLinks(noteTitle: string, content: string): void {
    // Remove existing relationships for this note
    this.removeNoteLinks(noteTitle);

    // Extract new outgoing links
    const outgoingLinks = extractOutgoingLinks(noteTitle, content);

    if (outgoingLinks.length > 0) {
      const targets = new Set(outgoingLinks.map((link) => link.toNote));
      this.relationships.set(noteTitle, targets);

      // Update backlinks
      for (const target of targets) {
        if (!this.backlinks.has(target)) {
          this.backlinks.set(target, new Set());
        }
        this.backlinks.get(target)!.add(noteTitle);
      }
    }
  }

  removeNoteLinks(noteTitle: string): void {
    // Remove outgoing links
    const oldTargets = this.relationships.get(noteTitle);
    if (oldTargets) {
      // Remove backlinks pointing to the old targets
      for (const target of oldTargets) {
        const targetBacklinks = this.backlinks.get(target);
        if (targetBacklinks) {
          targetBacklinks.delete(noteTitle);
          if (targetBacklinks.size === 0) {
            this.backlinks.delete(target);
          }
        }
      }
      this.relationships.delete(noteTitle);
    }

    // Remove any backlinks pointing to this note
    this.backlinks.delete(noteTitle);
  }

  getOutgoingLinks(noteTitle: string): string[] {
    return Array.from(this.relationships.get(noteTitle) || []);
  }

  getBacklinks(noteTitle: string): string[] {
    return Array.from(this.backlinks.get(noteTitle) || []);
  }

  getAllRelationships(): LinkRelationship[] {
    const relationships: LinkRelationship[] = [];
    for (const [fromNote, targets] of this.relationships) {
      for (const toNote of targets) {
        relationships.push({ fromNote, toNote });
      }
    }
    return relationships;
  }
}

const linkTracker = new LinkTracker();

// Ensure notes directory exists
export async function ensureNotesDir(): Promise<void> {
  try {
    await fs.access(NOTES_DIR);
  } catch {
    await fs.mkdir(NOTES_DIR, { recursive: true });
  }
}

// Initialize search index and link tracking with all notes
export async function initializeSearch(): Promise<void> {
  const notes = await getAllNotes();
  await searchService.initialize(notes);

  // Initialize link tracking
  for (const note of notes) {
    linkTracker.updateNoteLinks(note.title, note.content);
  }
}

// Helper functions for note operations
export async function getAllNotes(): Promise<Note[]> {
  await ensureNotesDir();
  const files = await fs.readdir(NOTES_DIR);
  const noteFiles = files.filter((f) => f.endsWith(".md"));

  const notes: Note[] = [];
  for (const file of noteFiles) {
    const fileContent = await fs.readFile(path.join(NOTES_DIR, file), "utf-8");

    notes.push({
      title: file.replace(/\.md$/, ""),
      content: fileContent, // Return raw file content including frontmatter
    });
  }
  return notes;
}

/**
 * Search for notes containing the specified keywords in title or content
 * @param query The search query string
 * @returns Array of notes matching the search criteria, ranked by relevance
 */
export async function searchNotes(query: string): Promise<Note[]> {
  if (!query.trim()) {
    return getAllNotes();
  }

  // If search service is not initialized, initialize it first
  if (!searchService.initialized) {
    await initializeSearch();
  }

  return searchService.search(query);
}

// Validate that the resolved path is within the notes directory
function validateNotePath(noteTitle: string): string {
  const notePath = path.join(NOTES_DIR, `${noteTitle}.md`);
  const resolvedPath = path.resolve(notePath);
  const resolvedNotesDir = path.resolve(NOTES_DIR);

  if (!resolvedPath.startsWith(resolvedNotesDir)) {
    throw new Error("Invalid note path: path traversal detected");
  }

  return notePath;
}

export async function getNote(noteTitle: string): Promise<Note | null> {
  await ensureNotesDir();

  try {
    const notePath = validateNotePath(noteTitle);
    const fileContent = await fs.readFile(notePath, "utf-8");
    return {
      title: noteTitle,
      content: fileContent, // Return raw file content including frontmatter
    };
  } catch (e) {
    return null;
  }
}

export async function saveNote(note: Note): Promise<void> {
  await ensureNotesDir();
  const notePath = validateNotePath(note.title);

  // Parse the incoming content to extract frontmatter and content
  const { data: frontmatter, content } = matter(note.content);

  // Filter out reserved fields from user metadata
  const userMetadata = Object.fromEntries(
    Object.entries(frontmatter).filter(([key]) => !RESERVED_FIELDS.includes(key))
  );

  // Add/update system metadata
  const date = new Date();
  const now =
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0") +
    " " +
    String(date.getHours()).padStart(2, "0") +
    ":" +
    String(date.getMinutes()).padStart(2, "0"); // YYYY-MM-DD HH:MM format in local timezone
  const existingNote = await getNote(note.title);
  const existingFrontmatter = existingNote ? matter(existingNote.content).data : {};

  const fullMetadata = {
    title: note.title,
    createdAt: existingFrontmatter.createdAt || now,
    updatedAt: now,
    ...userMetadata,
  };

  // Generate file content with enhanced frontmatter
  const fileContent = matter.stringify(content, fullMetadata);
  await fs.writeFile(notePath, fileContent, "utf-8");

  // Update search index
  const updatedNote: Note = {
    title: note.title,
    content: fileContent,
  };
  searchService.updateNote(updatedNote);

  // Update link tracking
  linkTracker.updateNoteLinks(note.title, fileContent);
}

export async function deleteNote(noteTitle: string): Promise<boolean> {
  await ensureNotesDir();

  try {
    const notePath = validateNotePath(noteTitle);
    await fs.access(notePath);
    await fs.unlink(notePath);

    // Remove from search index
    searchService.removeNote(noteTitle);

    // Remove from link tracking
    linkTracker.removeNoteLinks(noteTitle);

    return true;
  } catch (e) {
    return false;
  }
}

// Link relationship functions
export function getOutgoingLinks(noteTitle: string): string[] {
  return linkTracker.getOutgoingLinks(noteTitle);
}

export function getBacklinks(noteTitle: string): string[] {
  return linkTracker.getBacklinks(noteTitle);
}

export function getAllLinkRelationships(): LinkRelationship[] {
  return linkTracker.getAllRelationships();
}

export async function getNoteWithLinks(noteTitle: string): Promise<NoteWithLinks | null> {
  const note = await getNote(noteTitle);
  if (!note) {
    return null;
  }

  return {
    ...note,
    outgoingLinks: getOutgoingLinks(noteTitle),
    backlinks: getBacklinks(noteTitle),
  };
}
