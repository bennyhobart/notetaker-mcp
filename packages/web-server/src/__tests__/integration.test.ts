import request from "supertest";
import express from "express";
import cors from "cors";
import {
  getAllNotes,
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

// Create the same test app as in server.test.ts
function createTestApp(): express.Application {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get("/api/notes", async (req, res) => {
    try {
      const notes = await getAllNotes();
      res.json({ success: true, data: notes });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to get notes" });
    }
  });

  app.post("/api/notes", async (req, res) => {
    try {
      const { title, content } = req.body;
      if (!title || !content) {
        return res.status(400).json({ success: false, error: "Title and content are required" });
      }
      await saveNote({ title, content });
      res.json({ success: true, message: "Note created successfully" });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to create note" });
    }
  });

  app.get("/api/notes/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
      }
      const notes = await searchNotes(query);
      res.json({ success: true, data: notes });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to search notes" });
    }
  });

  app.get("/api/visualization/tags", async (req, res) => {
    try {
      const data = await generateVisualizationData();
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to generate visualization data" });
    }
  });

  app.post("/api/visualization/notes-by-tags", async (req, res) => {
    try {
      const { tags } = req.body;
      if (!Array.isArray(tags)) {
        return res.status(400).json({ success: false, error: "Tags must be an array" });
      }
      const notes = await getNotesWithTags(tags);
      res.json({ success: true, data: notes });
    } catch (error) {
      res.status(500).json({ success: false, error: "Failed to get notes by tags" });
    }
  });

  return app;
}

describe("Integration Tests", () => {
  let app: express.Application;

  const testNotes = [
    {
      title: "Frontend Development",
      content:
        "---\ntags: [javascript, react, frontend, web]\n---\n# Frontend Development\nBuilding user interfaces with React and JavaScript.",
    },
    {
      title: "Backend Systems",
      content:
        "---\ntags: [python, django, backend, api]\n---\n# Backend Systems\nCreating robust APIs with Django and Python.",
    },
    {
      title: "Full Stack Project",
      content:
        "---\ntags: [javascript, python, fullstack, web]\n---\n# Full Stack Project\nCombining frontend and backend technologies.",
    },
  ];

  beforeAll(async () => {
    app = createTestApp();
    await ensureNotesDir();
    await initializeSearch();
  });

  beforeEach(async () => {
    // Clean up any existing test notes
    for (const note of testNotes) {
      await deleteNote(note.title);
    }
  });

  afterEach(async () => {
    // Clean up test notes
    for (const note of testNotes) {
      await deleteNote(note.title);
    }
  });

  describe("Complete workflow: Create → Search → Visualize", () => {
    it("should create notes, search them, and generate visualization data", async () => {
      // Step 1: Create multiple notes
      for (const note of testNotes) {
        const createResponse = await request(app).post("/api/notes").send(note).expect(200);

        expect(createResponse.body.success).toBe(true);
      }

      // Step 2: Verify all notes exist
      const allNotesResponse = await request(app).get("/api/notes").expect(200);

      expect(allNotesResponse.body.success).toBe(true);
      const notesTitles = allNotesResponse.body.data.map((n: { title: string }) => n.title);
      testNotes.forEach((note) => {
        expect(notesTitles).toContain(note.title);
      });

      // Step 3: Search for specific content
      const searchResponse = await request(app).get("/api/notes/search?q=javascript").expect(200);

      expect(searchResponse.body.success).toBe(true);
      expect(searchResponse.body.data.length).toBe(2); // Frontend and Full Stack notes

      // Step 4: Generate visualization data
      const vizResponse = await request(app).get("/api/visualization/tags").expect(200);

      expect(vizResponse.body.success).toBe(true);
      const vizData = vizResponse.body.data;

      // Verify tag data
      expect(vizData.tags.length).toBeGreaterThan(0);
      const javascriptTag = vizData.tags.find(
        (t: { name: string; count: number }) => t.name === "javascript"
      );
      expect(javascriptTag).toBeDefined();
      expect(javascriptTag.count).toBe(2);

      // Verify connections
      expect(vizData.connections.length).toBeGreaterThan(0);
    });

    it("should filter notes by tags and maintain consistency", async () => {
      // Create test notes
      for (const note of testNotes) {
        await request(app).post("/api/notes").send(note).expect(200);
      }

      // Filter by single tag
      const singleTagResponse = await request(app)
        .post("/api/visualization/notes-by-tags")
        .send({ tags: ["javascript"] })
        .expect(200);

      expect(singleTagResponse.body.success).toBe(true);
      expect(singleTagResponse.body.data.length).toBe(2);

      // Filter by multiple tags (AND logic)
      const multiTagResponse = await request(app)
        .post("/api/visualization/notes-by-tags")
        .send({ tags: ["javascript", "web"] })
        .expect(200);

      expect(multiTagResponse.body.success).toBe(true);
      expect(multiTagResponse.body.data.length).toBe(2); // Frontend and Full Stack both have javascript AND web

      // Filter by very specific combination
      const specificResponse = await request(app)
        .post("/api/visualization/notes-by-tags")
        .send({ tags: ["python", "fullstack"] })
        .expect(200);

      expect(specificResponse.body.success).toBe(true);
      expect(specificResponse.body.data.length).toBe(1); // Only Full Stack note
      expect(specificResponse.body.data[0].title).toBe("Full Stack Project");
    });

    it("should handle edge cases gracefully", async () => {
      // Test empty search
      const emptySearchResponse = await request(app)
        .get("/api/notes/search?q=nonexistent")
        .expect(200);

      expect(emptySearchResponse.body.success).toBe(true);
      expect(emptySearchResponse.body.data.length).toBe(0);

      // Test visualization with no notes
      const emptyVizResponse = await request(app).get("/api/visualization/tags").expect(200);

      expect(emptyVizResponse.body.success).toBe(true);
      expect(emptyVizResponse.body.data.tags.length).toBeGreaterThanOrEqual(0);

      // Test filtering with non-existent tags
      const nonExistentTagResponse = await request(app)
        .post("/api/visualization/notes-by-tags")
        .send({ tags: ["nonexistent"] })
        .expect(200);

      expect(nonExistentTagResponse.body.success).toBe(true);
      expect(nonExistentTagResponse.body.data.length).toBe(0);
    });
  });

  describe("Data consistency across operations", () => {
    it("should maintain tag relationships after note updates", async () => {
      // Create initial note
      const initialNote = testNotes[0];
      await request(app).post("/api/notes").send(initialNote).expect(200);

      // Get initial visualization
      const initialVizResponse = await request(app).get("/api/visualization/tags").expect(200);

      const initialJsTag = initialVizResponse.body.data.tags.find(
        (t: { name: string; count: number }) => t.name === "javascript"
      );
      expect(initialJsTag?.count).toBe(1);

      // Create second note with overlapping tags
      const secondNote = testNotes[2]; // Full Stack Project also has javascript
      await request(app).post("/api/notes").send(secondNote).expect(200);

      // Get updated visualization
      const updatedVizResponse = await request(app).get("/api/visualization/tags").expect(200);

      const updatedJsTag = updatedVizResponse.body.data.tags.find(
        (t: { name: string; count: number }) => t.name === "javascript"
      );
      expect(updatedJsTag?.count).toBe(2);

      // Check for connection between overlapping tags
      const connections = updatedVizResponse.body.data.connections;
      const jsWebConnection = connections.find(
        (c: { source: string; target: string; weight: number }) =>
          (c.source === "javascript" && c.target === "web") ||
          (c.source === "web" && c.target === "javascript")
      );
      expect(jsWebConnection).toBeDefined();
      expect(jsWebConnection.weight).toBe(2); // Both notes have javascript and web
    });

    it("should provide consistent search and filter results", async () => {
      // Create all test notes
      for (const note of testNotes) {
        await request(app).post("/api/notes").send(note).expect(200);
      }

      // Search for 'javascript' using search API
      const searchResponse = await request(app).get("/api/notes/search?q=javascript").expect(200);

      // Filter for 'javascript' using visualization API
      const filterResponse = await request(app)
        .post("/api/visualization/notes-by-tags")
        .send({ tags: ["javascript"] })
        .expect(200);

      // Both should return the same notes (though in potentially different order)
      expect(searchResponse.body.data.length).toBe(filterResponse.body.data.length);

      const searchTitles = searchResponse.body.data.map((n: { title: string }) => n.title).sort();
      const filterTitles = filterResponse.body.data.map((n: { title: string }) => n.title).sort();

      expect(searchTitles).toEqual(filterTitles);
    });
  });
});
