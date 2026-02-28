import CodeMirror from "@uiw/react-codemirror";
import { json } from "@codemirror/lang-json";
import { javascript } from "@codemirror/lang-javascript";
import { EditorView } from "@codemirror/view";
import { useCallback, useMemo } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: "json" | "javascript";
  placeholder?: string;
  minHeight?: string;
  readOnly?: boolean;
}

const theme = EditorView.theme({
  "&": {
    fontSize: "13px",
    border: "1px solid var(--border-light)",
    borderRadius: "0.5rem",
    backgroundColor: "white",
  },
  "&.cm-focused": {
    outline: "none",
    borderColor: "color-mix(in srgb, var(--primary) 50%, transparent)",
    boxShadow: "0 0 0 1px var(--primary)",
  },
  ".cm-content": {
    fontFamily:
      'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    padding: "12px 0",
    caretColor: "var(--text-main)",
  },
  ".cm-line": {
    padding: "0 16px",
  },
  ".cm-gutters": {
    backgroundColor: "var(--sidebar-light)",
    borderRight: "1px solid var(--border-light)",
    color: "var(--text-muted)",
    borderRadius: "0.5rem 0 0 0.5rem",
    fontSize: "11px",
  },
  ".cm-activeLineGutter": {
    backgroundColor: "color-mix(in srgb, var(--primary) 8%, transparent)",
  },
  ".cm-activeLine": {
    backgroundColor: "color-mix(in srgb, var(--primary) 4%, transparent)",
  },
  ".cm-selectionBackground": {
    backgroundColor:
      "color-mix(in srgb, var(--primary) 15%, transparent) !important",
  },
  ".cm-cursor": {
    borderLeftColor: "var(--primary)",
  },
  ".cm-placeholder": {
    color: "var(--text-muted)",
    fontStyle: "italic",
  },
});

const langExtensions = {
  json: () => json(),
  javascript: () => javascript(),
};

export function CodeEditor({
  value,
  onChange,
  language = "json",
  placeholder,
  minHeight = "200px",
  readOnly = false,
}: CodeEditorProps) {
  const handleChange = useCallback(
    (val: string) => onChange(val),
    [onChange]
  );

  const extensions = useMemo(
    () => [
      langExtensions[language](),
      EditorView.lineWrapping,
      ...(readOnly ? [EditorView.editable.of(false)] : []),
    ],
    [language, readOnly]
  );

  return (
    <CodeMirror
      value={value}
      onChange={handleChange}
      extensions={extensions}
      theme={theme}
      placeholder={placeholder}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: !readOnly,
        bracketMatching: true,
        closeBrackets: !readOnly,
        autocompletion: false,
        highlightActiveLine: !readOnly,
        highlightActiveLineGutter: !readOnly,
        indentOnInput: !readOnly,
        tabSize: 2,
      }}
      minHeight={minHeight}
    />
  );
}
