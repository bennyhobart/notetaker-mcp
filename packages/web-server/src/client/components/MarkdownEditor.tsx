import React, { useState, useEffect, useRef } from "react";
import { Note } from "../types";
import { EditorView, keymap, drawSelection } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { searchKeymap } from "@codemirror/search";
import {
  autocompletion,
  completionKeymap,
  closeBrackets,
  closeBracketsKeymap,
} from "@codemirror/autocomplete";
import { foldKeymap } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { syntaxHighlighting, defaultHighlightStyle, indentOnInput } from "@codemirror/language";
import { noteLinkExtension } from "./NoteLinkExtension";

interface MarkdownEditorProps {
  note: Note;
  onSave: (title: string, content: string) => Promise<void>;
  onClose: () => void;
  onNavigateToNote?: (noteTitle: string) => void;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  note,
  onSave,
  onClose,
  onNavigateToNote,
}): JSX.Element => {
  const [isSaving, setIsSaving] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const editorViewRef = useRef<EditorView | null>(null);
  const [content, setContent] = useState(note.content);
  const hasChanges = content !== note.content;

  // Initialize CodeMirror
  useEffect(() => {
    if (editorRef.current && !editorViewRef.current) {
      const extensions = [
        // Basic setup
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        closeBrackets(),
        autocompletion(),

        // History and search
        history(),

        // Syntax highlighting
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

        // Markdown language support
        markdown({
          codeLanguages: languages,
        }),

        // NoteLink extension
        noteLinkExtension,

        // Keymaps
        keymap.of([
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...foldKeymap,
          ...completionKeymap,
          ...lintKeymap,
        ]),

        // Custom styling
        EditorView.theme({
          "&": {
            height: "100%",
            fontSize: "14px",
            fontFamily:
              '"SF Mono", Monaco, "Inconsolata", "Roboto Mono", Consolas, "Courier New", monospace',
          },
          ".cm-content": {
            padding: "20px",
            minHeight: "400px",
            lineHeight: "1.6",
          },
          ".cm-focused": {
            outline: "none",
          },
          ".cm-editor": {
            height: "100%",
          },
          ".cm-scroller": {
            fontSize: "14px",
          },
          ".cm-line": {
            padding: "0 0 0 4px",
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            const newContent = update.state.doc.toString();
            setContent(newContent);
          }
        }),
      ];

      editorViewRef.current = new EditorView({
        state: EditorState.create({
          doc: note.content,
          extensions,
        }),
        parent: editorRef.current,
      });

      // Add event listener for note link clicks
      const handleNoteLinkClick = (event: Event): void => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail?.target && onNavigateToNote) {
          onNavigateToNote(customEvent.detail.target);
        }
      };

      editorRef.current?.addEventListener("notelink-click", handleNoteLinkClick);

      return () => {
        editorRef.current?.removeEventListener("notelink-click", handleNoteLinkClick);
      };
    }

    return () => {
      if (editorViewRef.current) {
        editorViewRef.current.destroy();
        editorViewRef.current = null;
      }
    };
  }, [note, onNavigateToNote]);

  const handleSave = async (): Promise<void> => {
    if (!note || !hasChanges) return;

    setIsSaving(true);
    try {
      await onSave(note.title, content);
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
          <h1 className="text-xl font-semibold text-gray-800">{note.title}</h1>
          {hasChanges && (
            <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (editorViewRef.current) {
                editorViewRef.current.dispatch({
                  changes: {
                    from: 0,
                    to: editorViewRef.current.state.doc.length,
                    insert: note.content,
                  },
                });
              }
            }}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isSaving || !hasChanges}
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
      <div className="flex-1 flex justify-center bg-gray-50">
        <div className="w-full max-w-4xl bg-white shadow-sm min-h-0 flex flex-col">
          <div ref={editorRef} className="flex-1 min-h-0" />
        </div>
      </div>
    </div>
  );
};

export default MarkdownEditor;
