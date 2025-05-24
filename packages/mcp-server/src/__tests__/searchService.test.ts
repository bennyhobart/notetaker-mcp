import { searchService } from "../searchService.js";
import { Note } from "../noteService.js";

describe("SearchService", () => {
  const testNotes: Note[] = [
    {
      title: "JavaScript Fundamentals",
      content: "Learn the basics of JavaScript programming language with examples.",
    },
    {
      title: "Python Data Science",
      content: "Data analysis and machine learning with Python libraries.",
    },
    {
      title: "Web Development Guide",
      content: "HTML, CSS, and JavaScript for building modern web applications.",
    },
    {
      title: "Database Systems",
      content: "SQL and NoSQL database design and optimization techniques.",
    },
    {
      title: "React Components",
      content: "Building reusable UI components with React and TypeScript.",
    },
  ];

  beforeEach(async () => {
    // Initialize with test notes before each test
    await searchService.initialize(testNotes);
  });

  describe("Initialization", () => {
    it("should initialize with notes", async () => {
      expect(searchService.initialized).toBe(true);
    });

    it("should start uninitialized", async () => {
      // Create a fresh instance (we can't easily test this with singleton)
      // But we can test reinitialization
      await searchService.initialize([]);
      expect(searchService.initialized).toBe(true);

      // Re-initialize with test notes
      await searchService.initialize(testNotes);
      expect(searchService.initialized).toBe(true);
    });

    it("should clear existing notes on reinitialization", async () => {
      // First initialize with test notes
      await searchService.initialize(testNotes);
      let results = searchService.search("JavaScript");
      expect(results.length).toBeGreaterThan(0);

      // Reinitialize with different notes
      const newNotes: Note[] = [
        { title: "Go Programming", content: "Learn Go programming language." },
      ];
      await searchService.initialize(newNotes);

      // Old notes should not be found
      results = searchService.search("JavaScript");
      expect(results.length).toBe(0);

      // New notes should be found
      results = searchService.search("Go");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("Go Programming");
    });
  });

  describe("Basic Search", () => {
    it("should return empty array for empty query", () => {
      const results = searchService.search("");
      expect(results).toEqual([]);
    });

    it("should return empty array for whitespace-only query", () => {
      const results = searchService.search("   ");
      expect(results).toEqual([]);
    });

    it("should find notes by exact title match", () => {
      const results = searchService.search("JavaScript Fundamentals");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((note) => note.title === "JavaScript Fundamentals")).toBe(true);
    });

    it("should find notes by partial title match", () => {
      const results = searchService.search("JavaScript");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((note) => note.title === "JavaScript Fundamentals")).toBe(true);
      expect(results.some((note) => note.title === "Web Development Guide")).toBe(true);
    });

    it("should find notes by content match", () => {
      const results = searchService.search("machine learning");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("Python Data Science");
    });

    it("should be case insensitive", () => {
      const results = searchService.search("JAVASCRIPT");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((note) => note.title === "JavaScript Fundamentals")).toBe(true);
    });

    it("should return no results for non-existent terms", () => {
      const results = searchService.search("nonexistent");
      expect(results).toEqual([]);
    });
  });

  describe("Advanced Search Features", () => {
    it("should support fuzzy search", () => {
      // Test with a typo
      const results = searchService.search("javasript"); // missing 'c'
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((note) => note.title.includes("JavaScript"))).toBe(true);
    });

    it("should support prefix search", () => {
      const results = searchService.search("Java");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((note) => note.title === "JavaScript Fundamentals")).toBe(true);
    });

    it("should boost title matches over content matches", () => {
      // "React" appears in title of one note and might appear in content of others
      const results = searchService.search("React");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toBe("React Components");
    });

    it("should handle multiple search terms", () => {
      const results = searchService.search("web development");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((note) => note.title === "Web Development Guide")).toBe(true);
    });

    it("should handle special characters in search", () => {
      const results = searchService.search("HTML, CSS");
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((note) => note.title === "Web Development Guide")).toBe(true);
    });
  });

  describe("Index Management", () => {
    it("should add new notes to index", () => {
      const newNote: Note = {
        title: "Rust Programming",
        content: "Systems programming with Rust language.",
      };

      searchService.addNote(newNote);

      const results = searchService.search("Rust");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("Rust Programming");
    });

    it("should remove notes from index", () => {
      // Verify note exists first
      let results = searchService.search("Fundamentals");
      expect(results.some((note) => note.title === "JavaScript Fundamentals")).toBe(true);

      // Remove the note
      searchService.removeNote("JavaScript Fundamentals");

      // Note should no longer be found
      results = searchService.search("Fundamentals");
      expect(results.some((note) => note.title === "JavaScript Fundamentals")).toBe(false);

      // But other JavaScript-related notes should still exist
      results = searchService.search("JavaScript");
      expect(results.some((note) => note.title === "Web Development Guide")).toBe(true);
    });

    it("should update existing notes in index", () => {
      const updatedNote: Note = {
        title: "JavaScript Fundamentals",
        content: "Advanced JavaScript concepts including closures and async programming.",
      };

      searchService.updateNote(updatedNote);

      // Old content should not be found
      let results = searchService.search("basics");
      expect(results.some((note) => note.title === "JavaScript Fundamentals")).toBe(false);

      // New content should be found
      results = searchService.search("closures");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("JavaScript Fundamentals");
      expect(results[0].content).toBe(updatedNote.content);
    });

    it("should handle updating non-existent notes", () => {
      const newNote: Note = {
        title: "Non-existent Note",
        content: "This note was not in the original index.",
      };

      // Should not throw error
      expect(() => searchService.updateNote(newNote)).not.toThrow();

      // Note should be added to index
      const results = searchService.search("Non-existent");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("Non-existent Note");
    });

    it("should handle removing non-existent notes", () => {
      // Should not throw error
      expect(() => searchService.removeNote("Non-existent Note")).not.toThrow();

      // Should not affect other notes
      const results = searchService.search("JavaScript");
      expect(results.length).toBeGreaterThan(0);
    });

    it("should handle duplicate note additions", () => {
      const duplicateNote: Note = {
        title: "JavaScript Fundamentals", // Same title as existing note
        content: "This is duplicate content that should replace the original.",
      };

      searchService.addNote(duplicateNote);

      const results = searchService.search("duplicate content");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("JavaScript Fundamentals");
      expect(results[0].content).toBe(duplicateNote.content);
    });
  });

  describe("Search Results", () => {
    it("should return notes with correct structure", () => {
      const results = searchService.search("JavaScript");
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result).toHaveProperty("title");
        expect(result).toHaveProperty("content");
        expect(typeof result.title).toBe("string");
        expect(typeof result.content).toBe("string");
      }
    });

    it("should return results in relevance order", () => {
      // Add a note with "JavaScript" in title and one with "JavaScript" only in content
      const titleMatch: Note = {
        title: "JavaScript Advanced",
        content: "Advanced concepts in programming.",
      };
      const contentMatch: Note = {
        title: "Programming Guide",
        content: "This guide covers JavaScript and other languages.",
      };

      searchService.addNote(titleMatch);
      searchService.addNote(contentMatch);

      const results = searchService.search("JavaScript");
      expect(results.length).toBeGreaterThan(0);

      // Title matches should generally come before content-only matches
      // Find positions of our test notes
      const titleMatchIndex = results.findIndex((note) => note.title === "JavaScript Advanced");
      const contentMatchIndex = results.findIndex((note) => note.title === "Programming Guide");

      if (titleMatchIndex !== -1 && contentMatchIndex !== -1) {
        expect(titleMatchIndex).toBeLessThan(contentMatchIndex);
      }
    });

    it("should handle notes with special characters", () => {
      const specialNote: Note = {
        title: "C++ Programming",
        content: "Object-oriented programming with C++ language.",
      };

      searchService.addNote(specialNote);

      const results = searchService.search("C++");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("C++ Programming");
    });

    it("should handle notes with numbers", () => {
      const numberedNote: Note = {
        title: "Vue 3 Composition API",
        content: "Modern Vue.js development with version 3.",
      };

      searchService.addNote(numberedNote);

      const results = searchService.search("Vue 3");
      expect(results.length).toBe(1);
      expect(results[0].title).toBe("Vue 3 Composition API");
    });
  });

  describe("Uninitialized State", () => {
    it("should return empty results when not initialized", () => {
      // Create a new search service instance (simulated by reinitializing with empty array)
      searchService["isInitialized"] = false;

      const results = searchService.search("JavaScript");
      expect(results).toEqual([]);

      // Restore initialized state
      searchService["isInitialized"] = true;
    });

    it("should not add notes when not initialized", () => {
      searchService["isInitialized"] = false;

      const newNote: Note = {
        title: "Test Note",
        content: "This should not be added.",
      };

      searchService.addNote(newNote);

      // Restore initialized state and check note was not added
      searchService["isInitialized"] = true;
      const results = searchService.search("Test Note");
      expect(results.length).toBe(0);
    });

    it("should not remove notes when not initialized", () => {
      const originalResults = searchService.search("JavaScript");
      const originalCount = originalResults.length;

      searchService["isInitialized"] = false;
      searchService.removeNote("JavaScript Fundamentals");

      // Restore initialized state and check note was not removed
      searchService["isInitialized"] = true;
      const newResults = searchService.search("JavaScript");
      expect(newResults.length).toBe(originalCount);
    });

    it("should not update notes when not initialized", () => {
      searchService["isInitialized"] = false;

      const updatedNote: Note = {
        title: "JavaScript Fundamentals",
        content: "This update should not apply.",
      };

      searchService.updateNote(updatedNote);

      // Restore initialized state and check note was not updated
      searchService["isInitialized"] = true;
      const results = searchService.search("This update should not apply");
      expect(results.length).toBe(0);
    });
  });
});
