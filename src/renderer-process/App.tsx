import { useState, useEffect, useRef, ChangeEventHandler } from "react";
import QuillEditor from "./editor/quill";
import "./styles/App.css";

/* ------------------------------------------------ */

function App() {
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

  console.log(editorRef.current, content);

  return (
    <div className="memo-app">
      <header className="app-header">
        <h1 className="text-3xl font-bold text-blue-600">Memo</h1>
        <div className="toolbar">
          <button onClick={() => applyHighlight('#fca5a5')}>New</button>
          <button>Open</button>
          <button>Save</button>
          <span className="save-indicator">
            {isSaved ? "✓ Saved" : "● Unsaved"}
          </span>
        </div>
      </header>

      {/* 
        Custom Toolbar
        
        Should have headers (h1-h3)
        Should have bold and italic
        Should have highlight and uppercase
        Should have quote and link insertion
        Should have list (bullet and number)

      */}

      <div id="toolbar" className="mb-4 border border-gray-300 rounded-t-lg p-3 bg-gray-50">
        <span className="ql-formats">
          <button className="ql-bold"></button>
          <button className="ql-italic"></button>
          <select className="ql-header">
            <option value="1"></option>
            <option value="2"></option>
            <option selected></option>
          </select>
        </span>
      </div>

      <main className="editor-container">
        <div
          className="markdown-editor border border-red-500 min-h-[300px]"
          ref={editorRef}
        />
      </main>
    </div>
  );
}

export default App;
