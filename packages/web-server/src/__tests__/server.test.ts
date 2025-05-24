import request from "supertest";
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

// Create a test app instance (extracted from server.ts)
function createTestApp(): express.Application {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes (same as server.ts)

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

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ success: true, message: "Server is running", timestamp: new Date().toISOString() });
  });

  return app;
}

describe("Web Server API", () => {
  let app: express.Application;

  beforeAll(async () => {
    app = createTestApp();
    await ensureNotesDir();
    await initializeSearch();
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/api/health").expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Server is running",
        timestamp: expect.any(String),
      });
    });
  });

  describe("Notes API", () => {
    const testNote = {
      title: "Test Note",
      content: "---\ntags: [test, example]\n---\n# Test Note\nThis is a test note content.",
    };

    beforeEach(async () => {
      // Clean up any existing test note
      await deleteNote(testNote.title);
    });

    afterEach(async () => {
      // Clean up test note
      await deleteNote(testNote.title);
    });

    it("should create a new note", async () => {
      const response = await request(app).post("/api/notes").send(testNote).expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Note created successfully",
      });
    });

    it("should get all notes", async () => {
      // Create a test note first
      await saveNote(testNote);

      const response = await request(app).get("/api/notes").expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it("should get a specific note", async () => {
      // Create a test note first
      await saveNote(testNote);

      const response = await request(app).get(`/api/notes/${testNote.title}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(testNote.title);
      expect(response.body.data.content).toContain("This is a test note content");
    });

    it("should return 404 for non-existent note", async () => {
      const response = await request(app).get("/api/notes/NonExistentNote").expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Note not found");
    });

    it("should update an existing note", async () => {
      // Create a test note first
      await saveNote(testNote);

      const updatedContent = "---\ntags: [updated]\n---\n# Updated Note\nThis content was updated.";

      const response = await request(app)
        .put(`/api/notes/${testNote.title}`)
        .send({ content: updatedContent })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Note updated successfully",
      });

      // Verify the note was updated
      const updatedNote = await getNote(testNote.title);
      expect(updatedNote?.content).toContain("This content was updated");
    });

    it("should delete a note", async () => {
      // Create a test note first
      await saveNote(testNote);

      const response = await request(app).delete(`/api/notes/${testNote.title}`).expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "Note deleted successfully",
      });

      // Verify the note was deleted
      const deletedNote = await getNote(testNote.title);
      expect(deletedNote).toBeNull();
    });

    it("should search notes", async () => {
      // Create a test note first
      await saveNote(testNote);

      const response = await request(app).get("/api/notes/search?q=test").expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it("should require query parameter for search", async () => {
      const response = await request(app).get("/api/notes/search").expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Query parameter "q" is required');
    });

    it("should validate required fields for note creation", async () => {
      const response = await request(app)
        .post("/api/notes")
        .send({ title: "Only Title" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe("Title and content are required");
    });
  });
});
