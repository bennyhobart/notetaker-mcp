import { createNewNote } from "../noteService.js";

describe("Note Service", () => {
  describe("createNewNote", () => {
    it("should create a note with the correct structure", () => {
      // Given
      const title = "Test Note";
      const content = "This is a test note content";

      // When
      const note = createNewNote(title, content);

      // Then
      expect(note.title).toEqual("Test Note");
      expect(note.content).toEqual("This is a test note content");
      expect(note.id).toBeDefined();
      expect(note.id.length).toBeGreaterThan(0);
      expect(note.createdAt).toBeDefined();
      expect(note.updatedAt).toBeDefined();
      expect(note.createdAt).toEqual(note.updatedAt);
    });
  });
});
