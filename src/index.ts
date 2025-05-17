import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ensureNotesDir, getAllNotes, getNote, saveNote, deleteNote, Note } from "./noteService.js";

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
        text: notes.map((note) => `- ${note.title}`).join("\n"),
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
    const note = await getNote(noteId);

    if (!note) {
      return {
        content: [{ type: "text", text: `Note with ID "${noteId}" not found.` }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `# ${note.title}\n${note.content}`,
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
    const note: Note = {
      title,
      content,
    };
    await saveNote(note);

    return {
      content: [
        {
          type: "text",
          text: `Note created successfully!\n\nTitle: ${note.title}\nContent: ${note.content}`,
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
    title: z.string(),
    content: z.string(),
  },
  async ({ title, content }) => {
    const note = await getNote(title);

    if (!note) {
      return {
        content: [{ type: "text", text: `Note with title "${title}" not found.` }],
      };
    }

    // Update only the provided fields
    if (title !== undefined) {
      note.title = title;
    }

    if (content !== undefined) {
      note.content = content;
    }

    await saveNote(note);

    return {
      content: [
        {
          type: "text",
          text: `Note updated successfully!\n\nTitle: ${note.title}`,
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
    noteTitle: z.string(),
  },
  async ({ noteTitle }) => {
    const deleted = await deleteNote(noteTitle);

    if (!deleted) {
      return {
        content: [
          {
            type: "text",
            text: `Note with title "${noteTitle}" not found or could not be deleted.`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Note with title "${noteTitle}" was successfully deleted.`,
        },
      ],
    };
  }
);

async function main(): Promise<void> {
  await ensureNotesDir();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
