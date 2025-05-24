import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import {
  getAllNotes,
  getNote,
  saveNote,
  deleteNote,
  searchNotes,
  ensureNotesDir,
  initializeSearch,
} from "@notetaker/mcp-server/noteService";
import {
  generateVisualizationData,
  getNotesWithTags,
} from "@notetaker/mcp-server/visualizationService";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files (including our visualization.html)
app.use(express.static(path.join(__dirname, "../../..", "public")));

// API Routes

// Get all notes
app.get("/api/notes", async (req, res) => {
  try {
    const notes = await getAllNotes();
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error getting notes:", error);
    res.status(500).json({ success: false, error: "Failed to get notes" });
  }
});

// Search notes
app.get("/api/notes/search", async (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }

    const notes = await searchNotes(query);
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error searching notes:", error);
    res.status(500).json({ success: false, error: "Failed to search notes" });
  }
});

// Get a specific note
app.get("/api/notes/:title", async (req, res) => {
  try {
    const note = await getNote(req.params.title);
    if (!note) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }
    res.json({ success: true, data: note });
  } catch (error) {
    console.error("Error getting note:", error);
    res.status(500).json({ success: false, error: "Failed to get note" });
  }
});

// Create a new note
app.post("/api/notes", async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({ success: false, error: "Title and content are required" });
    }

    await saveNote({ title, content });
    res.json({ success: true, message: "Note created successfully" });
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ success: false, error: "Failed to create note" });
  }
});

// Update a note
app.put("/api/notes/:title", async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: "Content is required" });
    }

    const existingNote = await getNote(req.params.title);
    if (!existingNote) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }

    await saveNote({ title: req.params.title, content });
    res.json({ success: true, message: "Note updated successfully" });
  } catch (error) {
    console.error("Error updating note:", error);
    res.status(500).json({ success: false, error: "Failed to update note" });
  }
});

// Delete a note
app.delete("/api/notes/:title", async (req, res) => {
  try {
    const deleted = await deleteNote(req.params.title);
    if (!deleted) {
      return res.status(404).json({ success: false, error: "Note not found" });
    }
    res.json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).json({ success: false, error: "Failed to delete note" });
  }
});

// Visualization API endpoints

// Get tag visualization data
app.get("/api/visualization/tags", async (req, res) => {
  try {
    const data = await generateVisualizationData();
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error generating visualization data:", error);
    res.status(500).json({ success: false, error: "Failed to generate visualization data" });
  }
});

// Get notes with specific tags
app.post("/api/visualization/notes-by-tags", async (req, res) => {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ success: false, error: "Tags must be an array" });
    }

    const notes = await getNotesWithTags(tags);
    res.json({ success: true, data: notes });
  } catch (error) {
    console.error("Error getting notes by tags:", error);
    res.status(500).json({ success: false, error: "Failed to get notes by tags" });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running", timestamp: new Date().toISOString() });
});

// Serve the visualization page at root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../../..", "visualization.html"));
});

// Initialize and start server
async function startServer(): Promise<void> {
  try {
    // Ensure notes directory exists and initialize search
    await ensureNotesDir();
    await initializeSearch();

    app.listen(PORT, () => {
      console.warn(`🚀 Web server running at http://localhost:${PORT}`);
      console.warn(`📊 Visit http://localhost:${PORT} to view your notes visualization`);
      console.warn(`🔗 API available at http://localhost:${PORT}/api/*`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.warn("\n👋 Shutting down server...");
  process.exit(0);
});

startServer();
