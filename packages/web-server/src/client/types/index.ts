export interface Note {
  title: string;
  content: string;
}

export interface NoteWithPreview {
  title: string;
  preview: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
