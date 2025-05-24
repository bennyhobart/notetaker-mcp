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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Environment configuration with validation
const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV !== "production",
};

// Basic validation
if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
  throw new Error("Invalid PORT environment variable");
}

// Development logging
if (config.isDevelopment) {
  app.use((req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path}`);
    next();
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the built React app
const clientDistPath = path.join(__dirname, "..", "dist", "client");

app.use(express.static(clientDistPath));

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

// Health check endpoints
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    version: process.env.npm_package_version || "1.0.0",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    api: "connected",
    mcp: "connected",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// Serve the React app for all non-API routes (SPA fallback)
app.get("*", (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ success: false, error: "API endpoint not found" });
  }
  res.sendFile(path.join(clientDistPath, "index.html"));
});

// Initialize and start server
async function startServer(): Promise<void> {
  try {
    // Ensure notes directory exists and initialize search
    await ensureNotesDir();
    await initializeSearch();

    app.listen(config.port, () => {
      console.log(`\n🚀 Web server running at http://localhost:${config.port}`);
      console.log(`📝 Visit http://localhost:${config.port} to manage your notes`);
      console.log(`🔗 API available at http://localhost:${config.port}/api/*`);
      console.log(`❤️  Health check: http://localhost:${config.port}/health`);
      console.log(`🔧 Environment: ${config.nodeEnv}\n`);
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
