import { useState, useEffect, ChangeEventHandler } from "react";
import "./styles/App.css";

/* ------------------------------------------------ */

declare global {
  interface Window {
    electron: {
      saveFile: (
        filePath: string | null,
        content: string
      ) => Promise<{
        success: boolean;
        canceled?: boolean;
        filePath: string | null;
      }>;
      openFile: () => Promise<{
        content: string;
        filePath: string | null;
      } | null>;
      newFile: () => Promise<void>;
    };
  }
}

function App() {
  const [content, setContent] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  // Save content with debounce of 2s.
  useEffect(() => {
    if (!currentFile) return;

    const timeout = setTimeout(() => saveContent(), 2000);

    return () => clearTimeout(timeout);
  }, [content]);

  const saveContent = async () => {
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
  };

  return (
    <div className="memo-app">
      <header className="app-header">
        <h1 className="text-3xl font-bold text-blue-600">Memo</h1>
        <div className="toolbar">
          <button onClick={handleNewFile}>New</button>
          <button onClick={handleOpenFile}>Open</button>
          <button onClick={saveContent} disabled={isSaved}>
            Save
          </button>
          <span className="save-indicator">
            {isSaved ? "✓ Saved" : "● Unsaved"}
          </span>
        </div>
      </header>

      <main className="editor-container">
        <textarea
          className="markdown-editor border border-red-500"
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing your thoughts..."
          autoFocus
        />
      </main>
    </div>
  );
}

export default App;
