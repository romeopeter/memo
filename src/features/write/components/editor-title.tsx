import { memo, useRef, useCallback, type KeyboardEvent, type ClipboardEvent } from "react";

/* ------------------------------------------------------------------ */

interface EditorTitleProps {
  onEnterKey?: () => void;
}

/**
 * Contenteditable H1 title field with CSS-based placeholder.
 * Prevents line breaks (Enter moves focus to body) and strips HTML on paste.
 */
const EditorTitle = memo(function EditorTitle({ onEnterKey }: EditorTitleProps) {
  const titleRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onEnterKey?.();
      }
    },
    [onEnterKey],
  );

  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  // Clear leftover <br> / empty nodes so :empty placeholder reappears
  const handleInput = useCallback(() => {
    const el = titleRef.current;
    if (!el) return;
    if (!el.textContent?.trim()) {
      el.innerHTML = "";
    }
  }, []);

  return (
    <div
      ref={titleRef}
      contentEditable
      role="textbox"
      aria-label="Title"
      data-placeholder="Title"
      className="editor-title outline-none text-(length:--font-size-h1) font-semibold leading-tight tracking-tight text-text-primary"
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onInput={handleInput}
      suppressContentEditableWarning
    />
  );
});

export default EditorTitle;
