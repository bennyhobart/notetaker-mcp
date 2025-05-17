import {
  ensureNotesDir,
  deleteNote,
  getAllNotes,
  getNote,
  saveNote,
  searchNotes,
  Note,
} from "../noteService.js";

describe("Note Service", () => {
  const testNote: Note = {
    title: "Test Note",
    content: "This is a test note.",
  };

  beforeAll(async () => {
    await ensureNotesDir();
  });

  afterEach(async () => {
    await deleteNote(testNote.title);
  });

  it("should create a note", async () => {
    await saveNote(testNote);
    const notes = await getAllNotes();
    expect(notes).toContainEqual(testNote);
  });

  it("should get a note by ID", async () => {
    await saveNote(testNote);
    const note = await getNote(testNote.title);
    expect(note).toEqual(testNote);
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
    expect(fetchedNote).toEqual(updatedNote);
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
});
