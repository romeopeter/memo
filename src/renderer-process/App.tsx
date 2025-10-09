import { useState, useEffect } from 'react';
import './App.css';

/* ------------------------------------------------ */

declare global {
  interface Window {
    electron: {
      saveFile: (filePath: string | null, content: string) => Promise<void>;
      openFile: () => Promise<{ content: string; filePath: string | null } | null>;
      newFile: () => Promise<void>;
    };
  }
}

function App() {
  const [content, setContent] = useState('');
  const [isSaved, setIsSaved] = useState(true);
  const [currentFile, setCurrentFile] = useState(null);

  // Auto-save effect with debouncing
  useEffect(() => {
    if (!content || isSaved) return;

    const timeoutId = setTimeout(() => {
      saveContent();
    }, 2000); // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(timeoutId);
  }, [content, isSaved]);

  const saveContent = async () => {
    try {
      // This will call your IPC handler in the main process
      await window.electron.saveFile(currentFile, content);
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
    setIsSaved(false);
  };

  const handleNewFile = () => {
    if (!isSaved) {
      if (!confirm('You have unsaved changes. Continue?')) return;
    }
    setContent('');
    setCurrentFile(null);
    setIsSaved(true);
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
      console.error('Failed to open file:', error);
    }
  };

  return (
    <div className="memeo-app">
      <header className="app-header">
        <h1>Memo</h1>
        <div className="toolbar">
          <button onClick={handleNewFile}>New</button>
          <button onClick={handleOpenFile}>Open</button>
          <button onClick={saveContent} disabled={isSaved}>
            Save
          </button>
          <span className="save-indicator">
            {isSaved ? '✓ Saved' : '● Unsaved'}
          </span>
        </div>
      </header>
      
      <main className="editor-container">
        <textarea
          className="markdown-editor"
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