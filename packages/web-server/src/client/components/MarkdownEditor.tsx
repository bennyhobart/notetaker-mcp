import React, { useState, useEffect, useRef } from "react";
import { obsidianExtensions, EditorState, EditorView } from "../utils/codemirrorConfig";
import { Note } from "../types";

interface MarkdownEditorProps {
  note: Note | null;
  onSave: (title: string, content: string) => Promise<void>;
  onClose: () => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ note, onSave, onClose }) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setHasChanges(false);
    }
  }, [note]);

  // Initialize CodeMirror
  useEffect(() => {
    if (editorRef.current && !editorViewRef.current) {
      try {
        const state = EditorState.create({
          doc: content,
          extensions: [
            ...obsidianExtensions,
            EditorView.updateListener.of((update) => {
              if (update.docChanged) {
                const newContent = update.state.doc.toString();
                setContent(newContent);
                setHasChanges(true);
              }
            }),
          ],
        });

        editorViewRef.current = new EditorView({
          state,
          parent: editorRef.current,
        });
      } catch (error) {
        console.error("Failed to initialize CodeMirror:", error);
      }
    }

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    };
  }, [note]);

  // Update CodeMirror content when note changes
  useEffect(() => {
    if (editorViewRef.current && content !== editorViewRef.current.state.doc.toString()) {
      editorViewRef.current.dispatch({
        changes: {
          from: 0,
          to: editorViewRef.current.state.doc.length,
          insert: content,
        },
      });
    }
  }, [content]);

  const handleSave = async () => {
    if (!note || !hasChanges) return;

    setIsSaving(true);
    try {
      await onSave(title, content);
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📝</div>
          <div className="text-xl font-medium">Select a note to view</div>
          <div className="text-sm mt-2">
            Choose a note from the list to start reading or editing
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close note"
          >
            ←
          </button>
          <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
          {hasChanges && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setContent(note.content);
              setHasChanges(false);
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isSaving}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 relative">
        <div ref={editorRef} />
      </div>
    </div>
  );
};

export default MarkdownEditor;
