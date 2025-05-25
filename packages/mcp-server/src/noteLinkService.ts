export interface NoteLink {
  target: string;
  displayText?: string;
  startPos: number;
  endPos: number;
}

export interface LinkRelationship {
  fromNote: string;
  toNote: string;
  displayText?: string;
}

/**
 * Parse NoteLinks from note content
 * Supports: [[Note Title]] and [[Note Title|Display Text]]
 */
export function parseNoteLinks(content: string): NoteLink[] {
  const noteLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
  const links: NoteLink[] = [];
  let match;

  while ((match = noteLinkRegex.exec(content)) !== null) {
    const target = match[1].trim();
    const displayText = match[2]?.trim();
    const startPos = match.index;
    const endPos = match.index + match[0].length;

    links.push({
      target,
      displayText,
      startPos,
      endPos,
    });
  }

  return links;
}

/**
 * Extract outgoing link relationships from a note
 */
export function extractOutgoingLinks(noteTitle: string, content: string): LinkRelationship[] {
  const noteLinks = parseNoteLinks(content);
  return noteLinks.map((link) => ({
    fromNote: noteTitle,
    toNote: link.target,
    displayText: link.displayText,
  }));
}

/**
 * Check if a string contains NoteLinks
 */
export function hasNoteLinks(content: string): boolean {
  return /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.test(content);
}

/**
 * Check if a NoteLink target is valid (non-empty and doesn't contain path traversal)
 */
export function isValidLinkTarget(target: string): boolean {
  return (
    target.trim().length > 0 &&
    !target.includes("..") &&
    !target.includes("/") &&
    !target.includes("\\")
  );
}
