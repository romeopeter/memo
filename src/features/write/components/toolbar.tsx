import { memo, useState, useEffect, useCallback } from "react";
import type Quill from "@lib/editor/quill";
import { Button } from "@components/shadcn/button";
import {
  BoldIcon,
  ItalicIcon,
  ImageIcon,
  Heading2Icon,
  QuoteIcon,
} from "lucide-react";
import { cn } from "@lib/utils";

/* ------------------------------------------------------------------ */

interface ToolbarProps {
  quill: Quill | null;
}

interface ActiveFormats {
  bold: boolean;
  italic: boolean;
  header: number | false;
  blockquote: boolean;
}

const EMPTY_FORMATS: ActiveFormats = {
  bold: false,
  italic: false,
  header: false,
  blockquote: false,
};

/**
 * Floating toolbar fixed at the bottom center of the editor.
 * Reads active formats from Quill's selection and toggles formatting.
 */
const Toolbar = memo(function Toolbar({ quill }: ToolbarProps) {
  const [formats, setFormats] = useState<ActiveFormats>(EMPTY_FORMATS);

  // Track active formats on selection and text changes
  useEffect(() => {
    if (!quill) return;

    const updateFormats = () => {
      const selection = quill.getSelection();
      if (!selection) return;

      const fmt = quill.getFormat(selection.index, selection.length);
      setFormats({
        bold: !!fmt.bold,
        italic: !!fmt.italic,
        header: typeof fmt.header === "number" ? fmt.header : false,
        blockquote: !!fmt.blockquote,
      });
    };

    quill.on("selection-change", updateFormats);
    quill.on("text-change", updateFormats);

    return () => {
      quill.off("selection-change", updateFormats);
      quill.off("text-change", updateFormats);
    };
  }, [quill]);

  const toggleBold = useCallback(() => {
    if (!quill) return;
    const fmt = quill.getFormat();
    quill.format("bold", !fmt.bold);
  }, [quill]);

  const toggleItalic = useCallback(() => {
    if (!quill) return;
    const fmt = quill.getFormat();
    quill.format("italic", !fmt.italic);
  }, [quill]);

  const toggleHeading = useCallback(() => {
    if (!quill) return;
    const fmt = quill.getFormat();
    quill.format("header", fmt.header ? false : 2);
  }, [quill]);

  const toggleBlockquote = useCallback(() => {
    if (!quill) return;
    const fmt = quill.getFormat();
    quill.format("blockquote", !fmt.blockquote);
  }, [quill]);

  const activeClass = "bg-gray-200";

  return (
    <div className="fixed bottom-8 left-1/2 z-(--z-fixed) -translate-x-1/2 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-1 border border-gray-200">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "size-9 p-0 rounded-full cursor-pointer",
          formats.bold && activeClass,
        )}
        title="Bold"
        onClick={toggleBold}
      >
        <BoldIcon className="size-4 text-gray-600" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "size-9 p-0 rounded-full cursor-pointer",
          formats.italic && activeClass,
        )}
        title="Italic"
        onClick={toggleItalic}
      >
        <ItalicIcon className="size-4 text-gray-600" />
      </Button>

      <div className="w-px h-6 bg-gray-200 mx-1" />

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "size-9 p-0 rounded-full cursor-pointer",
          formats.header && activeClass,
        )}
        title="Heading"
        onClick={toggleHeading}
      >
        <Heading2Icon className="size-5 text-gray-600" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "size-9 p-0 rounded-full cursor-pointer",
          formats.blockquote && activeClass,
        )}
        title="Quote"
        onClick={toggleBlockquote}
      >
        <QuoteIcon className="size-4 text-gray-600" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        className="size-9 p-0 rounded-full opacity-50 cursor-not-allowed"
        title="Image (coming soon)"
        disabled
      >
        <ImageIcon className="size-5 text-gray-600" />
      </Button>
    </div>
  );
});

export default Toolbar;
