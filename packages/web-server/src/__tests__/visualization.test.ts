import {
  generateVisualizationData,
  getNotesWithTags,
} from "@notetaker/mcp-server/visualizationService";
import {
  saveNote,
  deleteNote,
  ensureNotesDir,
  initializeSearch,
} from "@notetaker/mcp-server/noteService";

describe("Visualization Service", () => {
  const testNotes = [
    {
      title: "Note with Single Tag",
      content: "---\ntags: [javascript]\n---\n# JavaScript Note\nContent about JavaScript.",
    },
    {
      title: "Note with Multiple Tags",
      content:
        "---\ntags: [javascript, react, frontend]\n---\n# React Note\nContent about React and JavaScript.",
    },
    {
      title: "Note with Different Tags",
      content:
        "---\ntags: [python, backend]\n---\n# Python Note\nContent about Python backend development.",
    },
    {
      title: "Note without Tags",
      content: "---\n---\n# No Tags Note\nThis note has no tags.",
    },
  ];

  beforeAll(async () => {
    await ensureNotesDir();
    await initializeSearch();
  });

  beforeEach(async () => {
    // Ensure notes directory exists and clean up any existing test notes
    await ensureNotesDir();
    for (const note of testNotes) {
      await deleteNote(note.title);
    }
    // Also clean up the testnote.md that seems to be left over
    await deleteNote("testnote");
  });

  afterEach(async () => {
    // Clean up test notes
    for (const note of testNotes) {
      await deleteNote(note.title);
    }
    await deleteNote("testnote");
  });

  describe("generateVisualizationData", () => {
    it("should generate visualization data from notes with tags", async () => {
      // Create test notes
      for (const note of testNotes) {
        await saveNote(note);
      }

      const result = await generateVisualizationData();

      expect(result).toHaveProperty("tags");
      expect(result).toHaveProperty("connections");
      expect(result).toHaveProperty("totalNotes");

      expect(Array.isArray(result.tags)).toBe(true);
      expect(Array.isArray(result.connections)).toBe(true);
      expect(typeof result.totalNotes).toBe("number");
      expect(result.totalNotes).toBeGreaterThan(0);
    });

    it("should correctly count tag frequencies", async () => {
      // Create test notes
      for (const note of testNotes) {
        await saveNote(note);
      }

      const result = await generateVisualizationData();

      // Find JavaScript tag (should appear in 2 notes)
      const jsTag = result.tags.find(
        (tag: { name: string; count: number; notes: string[] }) => tag.name === "javascript"
      );
      expect(jsTag).toBeDefined();
      expect(jsTag?.count).toBe(2);
      expect(jsTag?.notes).toHaveLength(2);

      // Find React tag (should appear in 1 note)
      const reactTag = result.tags.find(
        (tag: { name: string; count: number; notes: string[] }) => tag.name === "react"
      );
      expect(reactTag).toBeDefined();
      expect(reactTag?.count).toBe(1);
      expect(reactTag?.notes).toHaveLength(1);
    });

    it("should generate connections between co-occurring tags", async () => {
      // Create test notes
      for (const note of testNotes) {
        await saveNote(note);
      }

      const result = await generateVisualizationData();

      // Should have connection between javascript and react
      const jsReactConnection = result.connections.find(
        (conn: { source: string; target: string; weight: number }) =>
          (conn.source === "javascript" && conn.target === "react") ||
          (conn.source === "react" && conn.target === "javascript")
      );
      expect(jsReactConnection).toBeDefined();
      expect(jsReactConnection?.weight).toBe(1);
    });

    it("should sort tags by frequency (descending)", async () => {
      // Create test notes
      for (const note of testNotes) {
        await saveNote(note);
      }

      const result = await generateVisualizationData();

      // Tags should be sorted by count in descending order
      for (let i = 1; i < result.tags.length; i++) {
        expect(result.tags[i - 1].count).toBeGreaterThanOrEqual(result.tags[i].count);
      }
    });

    it("should handle notes without tags", async () => {
      // Create only the note without tags
      await saveNote(testNotes[3]); // "Note without Tags"

      const result = await generateVisualizationData();

      expect(result.tags).toHaveLength(0);
      expect(result.connections).toHaveLength(0);
      expect(result.totalNotes).toBe(1);
    });

    it("should handle empty notes collection", async () => {
      // Don't create any notes
      const result = await generateVisualizationData();

      expect(result.tags).toHaveLength(0);
      expect(result.connections).toHaveLength(0);
      expect(result.totalNotes).toBeGreaterThanOrEqual(0); // May have existing notes from other tests
    });
  });

  describe("getNotesWithTags", () => {
    beforeEach(async () => {
      // Ensure clean state and create test notes for each test
      await ensureNotesDir();
      await initializeSearch();
      for (const note of testNotes) {
        await saveNote(note);
      }
    });

    it("should return notes containing specified tags", async () => {
      const result = await getNotesWithTags(["javascript"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // Two notes have 'javascript' tag

      // All returned notes should contain the tag
      for (const note of result) {
        expect(note.content).toContain("javascript");
      }
    });

    it("should return notes containing all specified tags (AND logic)", async () => {
      const result = await getNotesWithTags(["javascript", "react"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1); // Only one note has both tags

      // The returned note should contain both tags
      expect(result[0].content).toContain("javascript");
      expect(result[0].content).toContain("react");
      expect(result[0].title).toBe("Note with Multiple Tags");
    });

    it("should return empty array when no notes match all tags", async () => {
      const result = await getNotesWithTags(["javascript", "python"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0); // No note has both javascript and python tags
    });

    it("should return empty array for non-existent tags", async () => {
      const result = await getNotesWithTags(["nonexistent"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it("should handle empty tags array", async () => {
      const result = await getNotesWithTags([]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0); // Should return all notes when no tag filter
    });

    it("should be case insensitive", async () => {
      const result = await getNotesWithTags(["JAVASCRIPT"]);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2); // Should find javascript tags regardless of case
    });
  });
});
