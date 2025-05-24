import fs from "fs/promises";
import path from "path";
import os from "os";
import matter from "gray-matter";
import { searchService } from "./searchService.js";

export const NOTES_DIR = path.join(os.homedir(), ".notetaker-mcp", "notes");

// Reserved system fields that users cannot override
const RESERVED_FIELDS = ["title", "createdAt", "updatedAt"];

// Note type definition
export interface Note {
  title: string;
  content: string; // Raw file content including frontmatter
}

// Ensure notes directory exists
export async function ensureNotesDir(): Promise<void> {
  try {
    await fs.access(NOTES_DIR);
  } catch {
    await fs.mkdir(NOTES_DIR, { recursive: true });
  }
}

// Initialize search index with all notes
export async function initializeSearch(): Promise<void> {
  const notes = await getAllNotes();
  await searchService.initialize(notes);
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

// Sanitize note title to prevent path traversal
function sanitizeTitle(title: string): string {
  return title.replace(/[^a-zA-Z0-9\s\-_]/g, "").trim();
}

export async function getNote(noteTitle: string): Promise<Note | null> {
  await ensureNotesDir();
  const sanitizedTitle = sanitizeTitle(noteTitle);
  const notePath = path.join(NOTES_DIR, `${sanitizedTitle}.md`);
  try {
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
  const sanitizedTitle = sanitizeTitle(note.title);
  const notePath = path.join(NOTES_DIR, `${sanitizedTitle}.md`);

  // Parse the incoming content to extract frontmatter and content
  const { data: frontmatter, content } = matter(note.content);

  // Filter out reserved fields from user metadata
  const userMetadata = Object.fromEntries(
    Object.entries(frontmatter).filter(([key]) => !RESERVED_FIELDS.includes(key))
  );

  // Add/update system metadata
  const now = new Date().toISOString();
  const existingNote = await getNote(note.title);
  const existingFrontmatter = existingNote ? matter(existingNote.content).data : {};

  const fullMetadata = {
    title: sanitizedTitle,
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
}

export async function deleteNote(noteTitle: string): Promise<boolean> {
  await ensureNotesDir();
  const sanitizedTitle = sanitizeTitle(noteTitle);
  const notePath = path.join(NOTES_DIR, `${sanitizedTitle}.md`);

  try {
    await fs.access(notePath);
    await fs.unlink(notePath);

    // Remove from search index
    searchService.removeNote(noteTitle);

    return true;
  } catch (e) {
    return false;
  }
}
