import matter from "gray-matter";
import { getAllNotes, Note } from "./noteService.js";

export interface TagData {
  name: string;
  count: number;
  notes: string[]; // note titles that have this tag
}

export interface TagConnection {
  source: string;
  target: string;
  weight: number; // how often these tags appear together
}

export interface VisualizationData {
  tags: TagData[];
  connections: TagConnection[];
  totalNotes: number;
}

// Extract tags from all notes and analyze relationships
export async function generateVisualizationData(): Promise<VisualizationData> {
  const notes = await getAllNotes();
  const tagMap = new Map<string, TagData>();
  const connectionMap = new Map<string, number>();

  // Extract tags from each note
  for (const note of notes) {
    const { data: frontmatter } = matter(note.content);
    const tags = frontmatter.tags || [];

    if (!Array.isArray(tags)) continue;

    // Count individual tags
    for (const tag of tags) {
      const tagName = String(tag).toLowerCase();
      if (!tagMap.has(tagName)) {
        tagMap.set(tagName, { name: tagName, count: 0, notes: [] });
      }
      const tagData = tagMap.get(tagName)!;
      tagData.count++;
      tagData.notes.push(note.title);
    }

    // Track tag co-occurrences for network connections
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const tag1 = String(tags[i]).toLowerCase();
        const tag2 = String(tags[j]).toLowerCase();

        // Create consistent connection key (alphabetical order)
        const connectionKey = [tag1, tag2].sort().join("|");
        connectionMap.set(connectionKey, (connectionMap.get(connectionKey) || 0) + 1);
      }
    }
  }

  // Convert maps to arrays
  const tagsArray = Array.from(tagMap.values()).sort((a, b) => b.count - a.count);

  const connectionsArray: TagConnection[] = [];
  for (const [key, weight] of connectionMap) {
    const [source, target] = key.split("|");
    connectionsArray.push({ source, target, weight });
  }

  return {
    tags: tagsArray,
    connections: connectionsArray,
    totalNotes: notes.length,
  };
}

// Get notes that contain specific tags
export async function getNotesWithTags(tags: string[]): Promise<Note[]> {
  const notes = await getAllNotes();
  const lowerTags = tags.map((t) => t.toLowerCase());

  return notes.filter((note) => {
    const { data: frontmatter } = matter(note.content);
    const noteTags = ((frontmatter.tags as unknown[]) || []).map((t: unknown) =>
      String(t).toLowerCase()
    );
    return lowerTags.every((tag) => noteTags.includes(tag));
  });
}
