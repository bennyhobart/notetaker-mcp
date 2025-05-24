import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  ensureNotesDir,
  initializeSearch,
  getAllNotes,
  getNote,
  saveNote,
  deleteNote,
  searchNotes,
  Note,
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
        text: notes.map((note) => `- ${note.title}`).join("\n"),
      },
    ],
  };
});

// Search notes
server.tool(
  "search-notes",
  "Search notes by keywords",
  {
    query: z.string().describe("Keywords to search for in note titles and content"),
  },
  async ({ query }) => {
    const notes = await searchNotes(query);

    if (notes.length === 0) {
      return {
        content: [{ type: "text", text: `No notes found matching "${query}".` }],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Found ${notes.length} note(s) matching "${query}":\n\n${notes
            .map((note) => {
              // Get a short snippet from the content containing the query term if possible
              const snippet = getContentSnippet(note.content, query, 100);
              return `- ${note.title}\n  ${snippet}`;
            })
            .join("\n\n")}`,
        },
      ],
    };
  }
);

// Helper function to extract a snippet of content around the search query
function getContentSnippet(content: string, query: string, maxLength: number = 100): string {
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();

  // Find position of the first search term in the content
  const searchTerms = lowerQuery.split(/\s+/).filter((term) => term.length > 0);

  // Default to start of content
  let position = 0;

  // Try to find any of the search terms in the content
  for (const term of searchTerms) {
    const pos = lowerContent.indexOf(term);
    if (pos !== -1) {
      position = pos;
      break;
    }
  }

  // Calculate start and end positions for the snippet
  let start = Math.max(0, position - maxLength / 2);
  let end = Math.min(content.length, start + maxLength);

  // Adjust start if end was capped
  if (end === content.length) {
    start = Math.max(0, end - maxLength);
  }

  // Try to start and end at word boundaries
  if (start > 0) {
    const nextSpace = content.indexOf(" ", start);
    if (nextSpace !== -1 && nextSpace < position) {
      start = nextSpace + 1;
    }
  }

  if (end < content.length) {
    const lastSpace = content.lastIndexOf(" ", end);
    if (lastSpace !== -1 && lastSpace > position) {
      end = lastSpace;
    }
  }

  let snippet = content.substring(start, end);

  // Add ellipses if needed
  if (start > 0) {
    snippet = "..." + snippet;
  }

  if (end < content.length) {
    snippet = snippet + "...";
  }

  return snippet;
}

// Read a note by title
server.tool(
  "read-note",
  "Read a note",
  {
    title: z.string(),
  },
  async ({ title }) => {
    const note = await getNote(title);

    if (!note) {
      return {
        content: [{ type: "text", text: `Note with title "${title}" not found.` }],
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

    // Update the note content
    note.content = content;

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
  await initializeSearch();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
