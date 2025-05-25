import { Extension } from "@codemirror/state";
import { Decoration, DecorationSet, EditorView, ViewPlugin, ViewUpdate } from "@codemirror/view";

// Custom decoration for NoteLinks
const noteLinkDecoration = Decoration.mark({
  class: "cm-notelink",
  attributes: {
    style:
      "color: #2563eb; background-color: #eff6ff; padding: 2px 4px; border-radius: 4px; cursor: pointer;",
  },
});

// Plugin to add NoteLink decorations
const noteLinkPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      const builder = [];
      const doc = view.state.doc;
      const text = doc.toString();

      // Regex to match [[Note Title]] and [[Note Title|Display Text]]
      const noteLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
      let match;

      while ((match = noteLinkRegex.exec(text)) !== null) {
        const from = match.index;
        const to = match.index + match[0].length;

        builder.push(noteLinkDecoration.range(from, to));
      }

      return Decoration.set(builder);
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);

// Click handler for NoteLinks
const noteLinkClickHandler = EditorView.domEventHandlers({
  click: (event, view) => {
    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
    if (pos == null) return false;

    const doc = view.state.doc;
    const text = doc.toString();

    // Find if click is within a NoteLink
    const noteLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    let match;

    while ((match = noteLinkRegex.exec(text)) !== null) {
      const from = match.index;
      const to = match.index + match[0].length;

      if (pos >= from && pos <= to) {
        const target = match[1].trim();

        // Dispatch custom event to parent component
        const customEvent = new CustomEvent("notelink-click", {
          detail: { target },
          bubbles: true,
        });
        event.target?.dispatchEvent(customEvent);

        return true; // Prevent default click behavior
      }
    }

    return false;
  },
});

// CSS styles for NoteLinks
const noteLinkTheme = EditorView.theme({
  ".cm-notelink": {
    color: "#2563eb",
    backgroundColor: "#eff6ff",
    padding: "2px 4px",
    borderRadius: "4px",
    cursor: "pointer",
    textDecoration: "none",

    "&:hover": {
      backgroundColor: "#dbeafe",
    },
  },
});

// Export the complete extension
export const noteLinkExtension: Extension = [noteLinkPlugin, noteLinkClickHandler, noteLinkTheme];
