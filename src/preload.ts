// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI = {
  saveFile: (filePath: string | null, content: string) =>
    ipcRenderer.invoke("save-file", filePath, content),
  openFile: () => ipcRenderer.invoke("open-file"),
  newFile: () => ipcRenderer.invoke("new-file"),

  // Listen for events from main process
  onFileOpened: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => ipcRenderer.on("file-opened", callback),

  onFileSaved: (
    callback: (event: Electron.IpcRendererEvent, data: any) => void
  ) => ipcRenderer.on("file-saved", callback),
};

contextBridge.exposeInMainWorld("electron", electronAPI);

// Export the type so it can be used in the renderer
export type ElectronAPI = typeof electronAPI;
