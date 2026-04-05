import { useState, useEffect, useRef } from "react";
import Quill from "@lib/editor/quill";

/* ------------------------------------------------------------------ */

interface UseQuillOptions {
  placeholder?: string;
}

/**
 * Custom hook for initializing and managing a Quill editor instance.
 * Returns a stable Quill instance (via useState) so consumers re-render
 * once after mount when the instance becomes available.
 */
export function useQuill({
  placeholder = "Start writing...",
}: UseQuillOptions = {}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [quill, setQuill] = useState<Quill | null>(null);

  useEffect(() => {
    if (!editorRef.current || quill) return;

    const instance = new Quill(editorRef.current, {
      theme: false as any,
      modules: { toolbar: false },
      placeholder,
    });

    setQuill(instance);

    return () => {
      // Quill doesn't expose a destroy method — nullify ref so consumers
      // stop interacting with the orphaned instance.
      setQuill(null);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { editorRef, quill };
}
