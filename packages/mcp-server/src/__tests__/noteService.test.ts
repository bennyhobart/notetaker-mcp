import {
  ensureNotesDir,
  initializeSearch,
  deleteNote,
  getAllNotes,
  getNote,
  saveNote,
  searchNotes,
  Note,
  NOTES_DIR,
} from "../noteService.js";
import fs from "fs/promises";
import matter from "gray-matter";

describe("Note Service", () => {
  const testNote: Note = {
    title: "Test Note",
    content: "This is a test note.",
  };

  // Clean up test directory before and after all tests
  const cleanupTestDir = async (): Promise<void> => {
    try {
      await fs.rm(NOTES_DIR, { recursive: true, force: true });
    } catch (error) {
      // Ignore if directory doesn't exist
    }
  };

  beforeAll(async () => {
    await cleanupTestDir();
    await ensureNotesDir();
  });

  afterAll(async () => {
    await cleanupTestDir();
  });

  afterEach(async () => {
    await deleteNote(testNote.title);
  });

  it("should create a note", async () => {
    await saveNote(testNote);
    const notes = await getAllNotes();

    // Find our test note
    const createdNote = notes.find((n) => n.title === testNote.title);
    expect(createdNote).toBeDefined();

    // Parse content to check the markdown part
    const { content } = matter(createdNote!.content);
    expect(content.trim()).toBe(testNote.content);

    // Verify frontmatter contains system fields
    const { data } = matter(createdNote!.content);
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  it("should get a note by ID", async () => {
    await saveNote(testNote);
    const note = await getNote(testNote.title);
    expect(note).toBeDefined();
    expect(note!.title).toBe(testNote.title);

    // Parse content to check the markdown part
    const { content } = matter(note!.content);
    expect(content.trim()).toBe(testNote.content);

    // Verify frontmatter contains system fields
    const { data } = matter(note!.content);
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  it("should return null for a non-existent note", async () => {
    const note = await getNote("NonExistentNote");
    expect(note).toBeNull();
  });

  it("should update a note", async () => {
    await saveNote(testNote);
    const updatedNote = { ...testNote, content: "Updated content" };
    await saveNote(updatedNote);
    const fetchedNote = await getNote(testNote.title);

    expect(fetchedNote).toBeDefined();
    expect(fetchedNote!.title).toBe(updatedNote.title);

    // Parse content to check the markdown part
    const { content } = matter(fetchedNote!.content);
    expect(content.trim()).toBe("Updated content");

    // Verify timestamps are preserved/updated
    const { data } = matter(fetchedNote!.content);
    expect(data.createdAt).toBeDefined();
    expect(data.updatedAt).toBeDefined();
  });

  it("should delete a note", async () => {
    await saveNote(testNote);
    await deleteNote(testNote.title);
    const deletedNote = await getNote(testNote.title);
    expect(deletedNote).toBeNull();
  });

  describe("searchNotes", () => {
    const testNotes = [
      {
        title: "Physics Note",
        content: "Gravity is a fundamental force in physics. Newton's laws describe motion.",
      },
      {
        title: "Math Note",
        content: "Calculus is used to study rates of change and accumulation.",
      },
      {
        title: "Chemistry Note",
        content: "Chemical reactions involve the transformation of substances.",
      },
    ];

    // Save our test notes and get their count
    beforeEach(async () => {
      // Create test notes with different content for search testing
      for (const note of testNotes) {
        await saveNote(note);
      }
    });

    afterEach(async () => {
      // Delete all test notes after each test
      for (const note of testNotes) {
        await deleteNote(note.title);
      }
    });

    it("should find notes by title keywords", async () => {
      const results = await searchNotes("physics");
      expect(results.some((note) => note.title === "Physics Note")).toBe(true);
      // Make sure we only matched our test note
      const physicsNotes = results.filter((note) => note.title === "Physics Note");
      expect(physicsNotes.length).toBe(1);
    });

    it("should find notes by content keywords", async () => {
      const results = await searchNotes("newton");
      expect(results.some((note) => note.title === "Physics Note")).toBe(true);
      // Check that Newton only appears in this one test note
      const newtonNotes = results.filter((note) => note.content.toLowerCase().includes("newton"));
      expect(newtonNotes.length).toBe(1);
    });

    it("should find our test notes matching a common keyword", async () => {
      const results = await searchNotes("note");
      // Ensure all our test notes are found
      expect(
        testNotes.every((testNote) => results.some((result) => result.title === testNote.title))
      ).toBe(true);
    });

    it("should find notes containing any of multiple search terms", async () => {
      const results = await searchNotes("gravity calculus");
      expect(results.some((n) => n.title === "Physics Note")).toBe(true);
      expect(results.some((n) => n.title === "Math Note")).toBe(true);
      // Make sure we only matched these specific test notes
      const relevantNotes = results.filter(
        (note) => note.title === "Physics Note" || note.title === "Math Note"
      );
      expect(relevantNotes.length).toBe(2);
    });

    it("should find all our test notes when search string is empty", async () => {
      const results = await searchNotes("");
      // Check that all our test notes are included
      expect(
        testNotes.every((testNote) => results.some((result) => result.title === testNote.title))
      ).toBe(true);
    });

    it("should not find any of our test notes with unrelated search terms", async () => {
      const results = await searchNotes("quantum computing artificial intelligence");
      // None of our test notes should match these terms
      expect(
        testNotes.every((testNote) => !results.some((result) => result.title === testNote.title))
      ).toBe(true);
    });
  });

  describe("security", () => {
    it("should sanitize dangerous paths and keep files in notes directory", async () => {
      const dangerousNote: Note = {
        title: "../../../etc/passwd",
        content: "This should stay in notes dir",
      };

      await saveNote(dangerousNote);

      // Verify the file was created in the notes directory with sanitized name
      const files = await fs.readdir(NOTES_DIR);
      expect(files).toContain("etcpasswd.md");
      expect(files).not.toContain("../../../etc/passwd.md");

      // Verify we can retrieve it with the original dangerous title
      const retrievedNote = await getNote("../../../etc/passwd");
      expect(retrievedNote).toBeDefined();
      expect(retrievedNote!.title).toBe(dangerousNote.title);

      // Parse content to check the markdown part
      const { content } = matter(retrievedNote!.content);
      expect(content.trim()).toBe(dangerousNote.content);

      // Clean up
      await deleteNote("../../../etc/passwd");
    });

    it("should sanitize special characters in filenames", async () => {
      const specialCharNote: Note = {
        title: 'test<>:|?*"/\\note',
        content: "Content with special chars in title",
      };

      await saveNote(specialCharNote);

      // Check that only safe filename was created
      const files = await fs.readdir(NOTES_DIR);
      expect(files).toContain("testnote.md");

      // Verify we can still retrieve with original title
      const retrievedNote = await getNote('test<>:|?*"/\\note');
      expect(retrievedNote).toBeDefined();
      expect(retrievedNote!.title).toBe(specialCharNote.title);

      // Parse content to check the markdown part
      const { content } = matter(retrievedNote!.content);
      expect(content.trim()).toBe(specialCharNote.content);

      // Clean up
      await deleteNote('test<>:|?*"/\\note');
    });
  });

  describe("Note Format Validation", () => {
    afterEach(async () => {
      // Clean up test directory after each format validation test
      await cleanupTestDir();
      await ensureNotesDir();
    });
    it("should create notes with proper YAML frontmatter format", async () => {
      const testNote: Note = {
        title: "Format Test Note",
        content: "This is test content for format validation.",
      };

      await saveNote(testNote);
      const savedNote = await getNote(testNote.title);

      expect(savedNote).toBeDefined();

      // Parse the frontmatter
      const { data: frontmatter, content } = matter(savedNote!.content);

      // Validate frontmatter structure
      expect(frontmatter).toHaveProperty("title");
      expect(frontmatter).toHaveProperty("createdAt");
      expect(frontmatter).toHaveProperty("updatedAt");

      // Validate frontmatter values
      expect(frontmatter.title).toBe("Format Test Note");
      expect(typeof frontmatter.createdAt).toBe("string");
      expect(typeof frontmatter.updatedAt).toBe("string");

      // Validate content
      expect(content.trim()).toBe(testNote.content);

      // Clean up
      await deleteNote(testNote.title);
    });

    it("should use human-readable date format (YYYY-MM-DD HH:MM)", async () => {
      const testNote: Note = {
        title: "Date Format Test",
        content: "Testing date format validation.",
      };

      await saveNote(testNote);
      const savedNote = await getNote(testNote.title);

      expect(savedNote).toBeDefined();

      const { data: frontmatter } = matter(savedNote!.content);

      // Validate date format: YYYY-MM-DD HH:MM
      const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

      expect(frontmatter.createdAt).toMatch(dateRegex);
      expect(frontmatter.updatedAt).toMatch(dateRegex);

      // Validate that dates can be parsed as valid dates
      const createdAt = new Date(frontmatter.createdAt.replace(" ", "T") + ":00");
      const updatedAt = new Date(frontmatter.updatedAt.replace(" ", "T") + ":00");

      expect(createdAt).toBeInstanceOf(Date);
      expect(updatedAt).toBeInstanceOf(Date);
      expect(isNaN(createdAt.getTime())).toBe(false);
      expect(isNaN(updatedAt.getTime())).toBe(false);

      // Clean up
      await deleteNote(testNote.title);
    });

    it("should preserve createdAt when updating notes", async () => {
      const originalNote: Note = {
        title: "Update Date Test",
        content: "Original content.",
      };

      await saveNote(originalNote);
      const firstSave = await getNote(originalNote.title);
      const originalCreatedAt = matter(firstSave!.content).data.createdAt;

      // Wait a brief moment to ensure timestamps differ
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update the note
      const updatedNote: Note = {
        title: "Update Date Test",
        content: "Updated content.",
      };

      await saveNote(updatedNote);
      const secondSave = await getNote(updatedNote.title);
      const { data: updatedFrontmatter } = matter(secondSave!.content);

      // createdAt should remain the same
      expect(updatedFrontmatter.createdAt).toBe(originalCreatedAt);

      // updatedAt should be different (or at least same/newer)
      expect(updatedFrontmatter.updatedAt).toBeDefined();

      // Clean up
      await deleteNote(originalNote.title);
    });

    it("should preserve user metadata while adding system metadata", async () => {
      const noteWithMetadata: Note = {
        title: "Metadata Test",
        content: `---
tags: [programming, javascript]
priority: high
category: tutorial
custom_field: custom_value
---
# Test Note
This note has custom metadata.`,
      };

      await saveNote(noteWithMetadata);
      const savedNote = await getNote(noteWithMetadata.title);

      expect(savedNote).toBeDefined();

      const { data: frontmatter, content } = matter(savedNote!.content);

      // System metadata should be present
      expect(frontmatter).toHaveProperty("title");
      expect(frontmatter).toHaveProperty("createdAt");
      expect(frontmatter).toHaveProperty("updatedAt");

      // User metadata should be preserved
      expect(frontmatter.tags).toEqual(["programming", "javascript"]);
      expect(frontmatter.priority).toBe("high");
      expect(frontmatter.category).toBe("tutorial");
      expect(frontmatter.custom_field).toBe("custom_value");

      // Content should be preserved
      expect(content.trim()).toBe("# Test Note\nThis note has custom metadata.");

      // Clean up
      await deleteNote(noteWithMetadata.title);
    });

    it("should not allow overriding system fields", async () => {
      const noteWithSystemFields: Note = {
        title: "System Fields Test",
        content: `---
title: "User Provided Title"
createdAt: "2020-01-01 00:00"
updatedAt: "2020-01-01 00:00"
custom_field: "allowed"
---
Test content.`,
      };

      await saveNote(noteWithSystemFields);
      const savedNote = await getNote(noteWithSystemFields.title);

      expect(savedNote).toBeDefined();

      const { data: frontmatter } = matter(savedNote!.content);

      // System fields should be overridden with correct values
      expect(frontmatter.title).toBe("System Fields Test"); // Sanitized title

      // Dates should be current, not user-provided values
      const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
      expect(frontmatter.createdAt).toMatch(dateRegex);
      expect(frontmatter.updatedAt).toMatch(dateRegex);
      expect(frontmatter.createdAt).not.toBe("2020-01-01 00:00");
      expect(frontmatter.updatedAt).not.toBe("2020-01-01 00:00");

      // Custom fields should be preserved
      expect(frontmatter.custom_field).toBe("allowed");

      // Clean up
      await deleteNote(noteWithSystemFields.title);
    });

    it("should handle notes without frontmatter", async () => {
      const plainNote: Note = {
        title: "Plain Note",
        content: "Just plain markdown content without frontmatter.",
      };

      await saveNote(plainNote);
      const savedNote = await getNote(plainNote.title);

      expect(savedNote).toBeDefined();

      const { data: frontmatter, content } = matter(savedNote!.content);

      // System metadata should be added
      expect(frontmatter.title).toBe("Plain Note");
      expect(frontmatter.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);
      expect(frontmatter.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/);

      // Content should be preserved
      expect(content.trim()).toBe(plainNote.content);

      // Clean up
      await deleteNote(plainNote.title);
    });
  });

  describe("Search Functionality", () => {
    const searchTestNotes: Note[] = [
      {
        title: "JavaScript Tutorial",
        content: "Learn JavaScript programming with examples and best practices.",
      },
      {
        title: "Python Guide",
        content: "A comprehensive guide to Python development.",
      },
      {
        title: "Web Development",
        content: "HTML, CSS, and JavaScript for modern web applications.",
      },
      {
        title: "Database Design",
        content: "SQL and NoSQL database design principles.",
      },
    ];

    beforeAll(async () => {
      await ensureNotesDir();
      await initializeSearch();
    });

    beforeEach(async () => {
      // Create test notes
      for (const note of searchTestNotes) {
        await saveNote(note);
      }
    });

    afterEach(async () => {
      // Clean up test notes
      for (const note of searchTestNotes) {
        await deleteNote(note.title);
      }
    });

    describe("Basic Search", () => {
      it("should find notes by title", async () => {
        const results = await searchNotes("JavaScript");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((note) => note.title === "JavaScript Tutorial")).toBe(true);
      });

      it("should find notes by content", async () => {
        const results = await searchNotes("programming");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((note) => note.title === "JavaScript Tutorial")).toBe(true);
      });

      it("should return empty array for no matches", async () => {
        const results = await searchNotes("nonexistent");
        expect(results).toEqual([]);
      });

      it("should return all notes for empty query", async () => {
        const results = await searchNotes("");
        expect(results.length).toBe(searchTestNotes.length);
      });

      it("should handle case-insensitive search", async () => {
        const results = await searchNotes("javascript");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((note) => note.title === "JavaScript Tutorial")).toBe(true);
      });
    });

    describe("Advanced Search Features", () => {
      it("should support fuzzy search for typos", async () => {
        const results = await searchNotes("javasript"); // missing 'c'
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((note) => note.title === "JavaScript Tutorial")).toBe(true);
      });

      it("should support prefix search", async () => {
        const results = await searchNotes("java");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((note) => note.title === "JavaScript Tutorial")).toBe(true);
      });

      it("should boost title matches over content matches", async () => {
        const results = await searchNotes("JavaScript");
        expect(results.length).toBeGreaterThan(0);
        // The note with "JavaScript" in title should rank higher than content-only matches
        expect(results[0].title).toBe("JavaScript Tutorial");
      });

      it("should find multiple terms", async () => {
        const results = await searchNotes("web development");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((note) => note.title === "Web Development")).toBe(true);
      });
    });

    describe("Search After Operations", () => {
      it("should find newly created notes immediately", async () => {
        const newNote: Note = {
          title: "React Components",
          content: "Building reusable React components for modern applications.",
        };

        await saveNote(newNote);

        const results = await searchNotes("React");
        expect(results.length).toBeGreaterThan(0);
        expect(results.some((note) => note.title === "React Components")).toBe(true);

        // Clean up
        await deleteNote(newNote.title);
      });

      it("should reflect updated note content in search", async () => {
        const originalNote: Note = {
          title: "Test Update",
          content: "Original content about databases.",
        };

        await saveNote(originalNote);

        // Verify original content is searchable
        let results = await searchNotes("databases");
        expect(results.some((note) => note.title === "Test Update")).toBe(true);

        // Update the note
        const updatedNote: Note = {
          title: "Test Update",
          content: "Updated content about machine learning algorithms.",
        };

        await saveNote(updatedNote);

        // Old content should no longer be found
        results = await searchNotes("databases");
        expect(results.some((note) => note.title === "Test Update")).toBe(false);

        // New content should be found
        results = await searchNotes("machine learning");
        expect(results.some((note) => note.title === "Test Update")).toBe(true);

        // Clean up
        await deleteNote(originalNote.title);
      });

      it("should remove deleted notes from search results", async () => {
        const tempNote: Note = {
          title: "Temporary Note",
          content: "This note will be deleted and should not appear in search.",
        };

        await saveNote(tempNote);

        // Verify note is searchable
        let results = await searchNotes("Temporary");
        expect(results.some((note) => note.title === "Temporary Note")).toBe(true);

        // Delete the note
        await deleteNote(tempNote.title);

        // Note should no longer be found
        results = await searchNotes("Temporary");
        expect(results.some((note) => note.title === "Temporary Note")).toBe(false);
      });

      it("should maintain search index consistency after multiple operations", async () => {
        const testNotes: Note[] = [
          { title: "Note 1", content: "Content about artificial intelligence." },
          { title: "Note 2", content: "Content about machine learning." },
          { title: "Note 3", content: "Content about deep learning." },
        ];

        // Create multiple notes
        for (const note of testNotes) {
          await saveNote(note);
        }

        // Verify all are searchable
        let results = await searchNotes("learning");
        expect(results.length).toBe(2); // Note 2 and Note 3

        // Update one note
        const updatedNote: Note = {
          title: "Note 2",
          content: "Content about natural language processing.",
        };
        await saveNote(updatedNote);

        // Delete one note
        await deleteNote("Note 3");

        // Search should reflect changes
        results = await searchNotes("learning");
        expect(results.length).toBe(0); // No notes should match "learning" anymore

        results = await searchNotes("processing");
        expect(results.length).toBe(1); // Only updated Note 2
        expect(results[0].title).toBe("Note 2");

        results = await searchNotes("artificial");
        expect(results.length).toBe(1); // Only Note 1
        expect(results[0].title).toBe("Note 1");

        // Clean up
        await deleteNote("Note 1");
        await deleteNote("Note 2");
      });
    });

    describe("Search with Frontmatter", () => {
      it("should search through notes with YAML frontmatter", async () => {
        const noteWithFrontmatter: Note = {
          title: "Frontmatter Test",
          content: `---
tags: [development, testing]
priority: high
author: John Doe
---
# Testing YAML Frontmatter
This note contains YAML frontmatter and should be searchable by both content and metadata.`,
        };

        await saveNote(noteWithFrontmatter);

        // Search by content
        let results = await searchNotes("development");
        expect(results.some((note) => note.title === "Frontmatter Test")).toBe(true);

        // Search by content in body
        results = await searchNotes("searchable");
        expect(results.some((note) => note.title === "Frontmatter Test")).toBe(true);

        // Clean up
        await deleteNote(noteWithFrontmatter.title);
      });
    });
  });
});
