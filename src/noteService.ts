import fs from "fs/promises";
import path from "path";

export const NOTES_DIR = path.join("/Users/bennyhobart/Workspace/notetaker-mcp/notes");

// Note type definition
export interface Note {
  title: string;
  content: string;
}

// Ensure notes directory exists
export async function ensureNotesDir(): Promise<void> {
  try {
    await fs.access(NOTES_DIR);
  } catch {
    await fs.mkdir(NOTES_DIR, { recursive: true });
  }
}

// Helper functions for note operations
export async function getAllNotes(): Promise<Note[]> {
  await ensureNotesDir();
  const files = await fs.readdir(NOTES_DIR);
  const noteFiles = files;

  const notes: Note[] = [];
  for (const file of noteFiles) {
    const content = await fs.readFile(path.join(NOTES_DIR, file), "utf-8");

    notes.push({
      title: file.replace(/\.md$/, ""),
      content,
    });
  }
  return notes;
}

export async function getNote(noteTitle: string): Promise<Note | null> {
  await ensureNotesDir();
  const notePath = path.join(NOTES_DIR, `${noteTitle}.md`);
  try {
    const content = await fs.readFile(notePath, "utf-8");
    return {
      title: noteTitle,
      content,
    };
  } catch (e) {
    return null;
  }
}

export async function saveNote(note: Note): Promise<void> {
  await ensureNotesDir();
  const notePath = path.join(NOTES_DIR, `${note.title}.md`);
  await fs.writeFile(notePath, note.content, "utf-8");
}

export async function deleteNote(noteTitle: string): Promise<boolean> {
  await ensureNotesDir();
  const notePath = path.join(NOTES_DIR, `${noteTitle}.md`);

  try {
    await fs.access(notePath);
    await fs.unlink(notePath);
    return true;
  } catch (e) {
    return false;
  }
}
