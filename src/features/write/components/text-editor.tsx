import { useCallback } from "react";
import { useQuill } from "../hooks/use-quill";
import EditorTitle from "./editor-title";
import Toolbar from "./toolbar";

/* ------------------------------------------------------------------ */

export default function TextEditor() {
  const { editorRef, quill } = useQuill({ placeholder: "Start writing..." });

  const handleTitleEnter = useCallback(() => {
    quill?.focus();
  }, [quill]);

  return (
    <div className="editor-container">
      <EditorTitle onEnterKey={handleTitleEnter} />

      <div
        className="editor-body mt-4 min-h-[60vh] outline-none"
        ref={editorRef}
      />

      <Toolbar quill={quill} />
    </div>
  );
}
