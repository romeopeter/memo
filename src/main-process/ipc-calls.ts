import { ipcMain, dialog, BaseWindow } from "electron";
import fs from "node:fs/promises";

/* ------------------------------------- */

// Define a function to set up IPC calls
export function setupIpcCalls(mainWindow: BaseWindow | undefined) {
  // Handle invocable IPC calls from renderer process
  ipcMain.handle("save-file", async (_, filePath: string, content: string) => {
    let savePath: string | null = filePath;

    if (!mainWindow) {
      console.log("No main window available");
      return { success: false, error: "No active window" };
    }

    try {
      // If no file path, show saved dialogue.
      if (!savePath) {
        const saveDialog = await dialog.showSaveDialog(mainWindow, {
          title: "Save Memo",
          defaultPath: "memo.md",
          filters: [
            { name: "Markdown Files", extensions: ["md", "markdown"] },
            { name: "All Files", extensions: ["*"] },
          ],
        });

        if (saveDialog.canceled) {
          return { success: false, canceled: true };
        }

        savePath = saveDialog.filePath;
      }

      fs.writeFile(savePath, content, "utf-8");

      return { success: true, filePath: savePath };
    } catch (error: any) {
      savePath = null;
      return { success: false, error: error.message, filePath: savePath };
    }
  });

  ipcMain.handle("open-file", async () => {
    try {
      const openDialog = await dialog.showOpenDialog({
        title: "Open Memo",
        filters: [
          { name: "Markdown Files", extensions: ["md", "markdown"] },
          { name: "All Files", extensions: ["*"] },
        ],
        properties: ["openFile"],
      });

      if (openDialog.canceled) return null;

      const filePath = openDialog.filePaths[0];
      const content = await fs.readFile(filePath, "utf-8");

      return { content, filePath };
    } catch (error) {
      console.log("Unable to open file", error);
      throw error;
    }
  });

  // Listen for events from renderer process
  ipcMain.on("onFileOpen", (event) => {
    event.sender.send("new-file-response", { content: "", filePath: null });
  });
}
