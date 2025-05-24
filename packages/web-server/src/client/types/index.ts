export interface Note {
  title: string;
  content: string;
}

export interface NoteWithPreview {
  title: string;
  preview: string;
  tags: string[];
}

export interface Tag {
  name: string;
  count: number;
}

export interface TagConnection {
  source: string;
  target: string;
  weight: number;
}

export interface VisualizationData {
  tags: Tag[];
  connections: TagConnection[];
  totalNotes: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ViewMode = "visualization" | "notes";
