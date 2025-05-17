import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const NOTES_DIR = path.join(process.cwd(), "notes");

// Ensure notes directory exists
async function ensureNotesDir(): Promise<void> {
  try {
    await fs.access(NOTES_DIR);
  } catch {
    await fs.mkdir(NOTES_DIR, { recursive: true });
  }
}

// Note type definition
interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// Create server instance
const server = new McpServer({
  name: "note_taker",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

// Helper functions for note operations
async function getAllNotes(): Promise<Note[]> {
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

async function getNoteById(noteId: string): Promise<Note | null> {
  await ensureNotesDir();
  const notePath = path.join(NOTES_DIR, `${noteId}.json`);

  try {
    const content = await fs.readFile(notePath, "utf-8");
    return JSON.parse(content) as Note;
  } catch (e) {
    return null;
  }
}

async function saveNote(note: Note): Promise<void> {
  await ensureNotesDir();
  const notePath = path.join(NOTES_DIR, `${note.id}.json`);
  await fs.writeFile(notePath, JSON.stringify(note, null, 2), "utf-8");
}

async function deleteNoteById(noteId: string): Promise<boolean> {
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

// List all notes
server.tool("list-notes", "List all notes", {}, async () => {
  const notes = await getAllNotes();

  if (notes.length === 0) {
    return {
      content: [{ type: "text", text: "No notes found." }],
    };
  }

  return {
    content: [
      {
        type: "text",
        text: notes
          .map(
            (note) =>
              `- ${note.id}: ${note.title} (Last updated: ${new Date(
                note.updatedAt
              ).toLocaleString()})`
          )
          .join("\n"),
      },
    ],
  };
});

// Read a note by ID
server.tool(
  "read-note",
  "Read a note",
  {
    noteId: z.string(),
  },
  async ({ noteId }) => {
    const note = await getNoteById(noteId);

    if (!note) {
      return {
        content: [{ type: "text", text: `Note with ID "${noteId}" not found.` }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `# ${note.title}\n\n${note.content}\n\nCreated: ${new Date(
            note.createdAt
          ).toLocaleString()}\nUpdated: ${new Date(note.updatedAt).toLocaleString()}`,
        },
      ],
    };
  }
);

// Create a new note
server.tool(
  "create-note",
  "Create a note",
  {
    title: z.string(),
    content: z.string(),
  },
  async ({ title, content }) => {
    const now = new Date().toISOString();
    const id = crypto.randomUUID();

    const note: Note = {
      id,
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };

    await saveNote(note);

    return {
      content: [
        {
          type: "text",
          text: `Note created successfully!\n\nID: ${id}\nTitle: ${title}`,
        },
      ],
    };
  }
);

// Update an existing note
server.tool(
  "update-note",
  "Update a note",
  {
    noteId: z.string(),
    title: z.string().optional(),
    content: z.string().optional(),
  },
  async ({ noteId, title, content }) => {
    const note = await getNoteById(noteId);

    if (!note) {
      return {
        content: [{ type: "text", text: `Note with ID "${noteId}" not found.` }],
      };
    }

    // Update only the provided fields
    if (title !== undefined) {
      note.title = title;
    }

    if (content !== undefined) {
      note.content = content;
    }

    note.updatedAt = new Date().toISOString();
    await saveNote(note);

    return {
      content: [
        {
          type: "text",
          text: `Note updated successfully!\n\nID: ${noteId}\nTitle: ${note.title}`,
        },
      ],
    };
  }
);

// Delete a note
server.tool(
  "delete-note",
  "Delete a note",
  {
    noteId: z.string(),
  },
  async ({ noteId }) => {
    const deleted = await deleteNoteById(noteId);

    if (!deleted) {
      return {
        content: [
          {
            type: "text",
            text: `Note with ID "${noteId}" not found or could not be deleted.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Note with ID "${noteId}" was successfully deleted.`,
        },
      ],
    };
  }
);

async function main(): Promise<void> {
  // Ensure notes directory exists on startup
  await ensureNotesDir();

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Note Taker MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
