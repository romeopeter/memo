import { useState, useEffect, useRef } from "react";
import QuillEditor from "@lib/editor/quill";
import { Button } from "@components/shadcn/button";
import "../../styles/App.css";

/* ------------------------------------------------ */

export default function Editor() {
  const [isSaved, setIsSaved] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillEditor | null>(null);

  // Initiate Quill editor
  useEffect(() => {
    if (editorRef.current && !quillRef.current) {
      quillRef.current = new QuillEditor(editorRef.current, {
        theme: 'snow',
        modules: {
          toolbar: '#toolbar'
        },
        placeholder: 'What\'s on your mind today?'
      })
    }


    const quill = quillRef.current;

    // Listen for text change
    if (quill) {
      quill.on('text-change', () => {
        setContent(quill.root.innerHTML)
      })
    }


    return () => {
      if (quillRef.current) {
        quillRef.current = null
      }
    };
  }, [])

  // Save content with debounce of 2s.
  /*useEffect(() => {
    if (!currentFile) return;

    const timeout = setTimeout(() => saveContent(), 2000);

    return () => clearTimeout(timeout);
  }, [content]);*/

  const applyHighlight = (color: string) => {
    const quill = quillRef.current;

    if (!quill) return;

    const range = quill.getSelection();

    if (range) {
      console.log(quill)
      quill.formatText(range.index, range.length, 'highlight', color);
    }
  }

  const applyUppercase = () => {
    const quill = quillRef.current;

    if (!quill) return;

    const range = quill.getSelection();

    if (range) {
      const format = quill.getFormat(range.index);
      quill.formatText(range.index, range.length, "uppercase", !format.uppercase);
    }
  }

  const clearFormatting = () => {
    const quill = quillRef.current;

    if (!quill) return;

    const range = quill.getSelection();

    if (range) {
      quill.removeFormat(range.index, range.length)
    }
  }

  /*const saveContent = async () => {
    try {
      const savedPath = await window.electron.saveFile(currentFile, content);

      if (savedPath) {
        setCurrentFile(savedPath.filePath);
      }

      console.log(savedPath.filePath);
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const handleContentChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setContent(e.target.value);
  };

  const handleNewFile = () => {
    if (!isSaved) {
      if (!confirm("You have unsaved changes. Continue?")) return;
    }
    setContent("");
    setCurrentFile(null);
    setIsSaved(false);
  };

  const handleOpenFile = async () => {
    try {
      const result = await window.electron.openFile();
      if (result) {
        setContent(result.content);
        setCurrentFile(result.filePath);
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Failed to open file:", error);
    }
  };*/

  return (
    <div className="writestream-app">
      <header className="app-header flex items-center justify-between">
        <div className="flex items-center gap-5">
          <h1 className="text-2xl font-bold text-blue-600">Writestream</h1>
          <span>saved</span>
        </div>

        <Button>Share with us</Button>
      </header>

      <main className="h-screen editor-container">
        <div
          className="h-full max-h-[95%] markdown-editor overflow-y-scroll"
          ref={editorRef}
        />
      </main>
    </div>
  );
}
