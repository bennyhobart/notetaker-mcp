import { ensureNotesDir, deleteNote, getAllNotes, getNote, saveNote, Note } from "../noteService";

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
});
