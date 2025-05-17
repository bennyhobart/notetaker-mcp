import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const NOTES_DIR = path.join(process.cwd(), "notes");

// Note type definition
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
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
  const noteFiles = files.filter((file) => file.endsWith(".json"));

  const notes: Note[] = [];
  for (const file of noteFiles) {
    const content = await fs.readFile(path.join(NOTES_DIR, file), "utf-8");
    try {
      const note = JSON.parse(content) as Note;
      notes.push(note);
    } catch (e) {
      console.error(`Error parsing note file ${file}:`, e);
    }
  }

  // Sort by updatedAt, newest first
  return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function getNoteById(noteId: string): Promise<Note | null> {
  await ensureNotesDir();
  const notePath = path.join(NOTES_DIR, `${noteId}.json`);

  try {
    const content = await fs.readFile(notePath, "utf-8");
    return JSON.parse(content) as Note;
  } catch (e) {
    return null;
  }
}

export async function saveNote(note: Note): Promise<void> {
  await ensureNotesDir();
  const notePath = path.join(NOTES_DIR, `${note.id}.json`);
  await fs.writeFile(notePath, JSON.stringify(note, null, 2), "utf-8");
}

export async function deleteNoteById(noteId: string): Promise<boolean> {
  await ensureNotesDir();
  const notePath = path.join(NOTES_DIR, `${noteId}.json`);

  try {
    await fs.access(notePath);
    await fs.unlink(notePath);
    return true;
  } catch (e) {
    return false;
  }
}

// Helper for creating a new note
export function createNewNote(title: string, content: string): Note {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: now,
    updatedAt: now,
  };
}
