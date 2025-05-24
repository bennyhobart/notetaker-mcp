import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";

// Extensions with markdown support and syntax highlighting
const obsidianExtensions = [
  basicSetup,
  markdown({ codeLanguages: languages }),
  EditorView.theme({
    "&": {
      fontSize: "14px",
      fontFamily:
        "ui-monospace, SFMono-Regular, 'SF Mono', Consolas, 'Liberation Mono', Menlo, monospace",
    },
    ".cm-content": {
      padding: "16px",
      lineHeight: "1.5",
    },
    ".cm-focused": {
      outline: "none",
    },
    ".cm-editor": {
      height: "100%",
    },
    ".cm-scroller": {
      height: "100%",
    },
  }),
];

export { obsidianExtensions, EditorState, EditorView };
