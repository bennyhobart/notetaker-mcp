import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ensureNotesDir,
  getAllNotes,
  getNoteById,
  saveNote,
  deleteNoteById,
  createNewNote,
} from "./noteService.js";

// Create server instance
const server = new McpServer({
  name: "note_taker",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

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
    const note = createNewNote(title, content);
    await saveNote(note);

    return {
      content: [
        {
          type: "text",
          text: `Note created successfully!\n\nID: ${note.id}\nTitle: ${title}`,
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
