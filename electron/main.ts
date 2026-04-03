import { app, BrowserWindow, protocol } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { setupIpcCalls } from "./ipc/ipc-calls";
import { setupAuthIpcHandlers } from "./ipc/auth.ipc";
import { setupPublishIpcHandlers } from "./ipc/publish.ipc";
import { getTokenStore } from "./services/auth/token-store";

/* -------------------------------------------------------- */

// Declare global variables provided by Vite or your build tool
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

let mainWindow;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "./preload.js"),
    },
  });

  if (typeof MAIN_WINDOW_VITE_DEV_SERVER_URL !== "undefined") {
    console.log("Loading from dev server:", MAIN_WINDOW_VITE_DEV_SERVER_URL);
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    console.log("Loading from file system");
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  if (!app.isPackaged) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  // Setup IPC handlers for file operations
  setupIpcCalls(mainWindow);

  // Setup IPC handlers for authentication and publishing
  setupAuthIpcHandlers();
  setupPublishIpcHandlers();
};

/*  ------ App lifecycle ---- */

/**
 * Register custom protocol for OAuth callbacks
 * This allows platforms to redirect to writestream://auth/callback
 */
function registerOAuthProtocol() {
  // Register protocol as privileged (secure)
  protocol.registerSchemesAsPrivileged([
    {
      scheme: "writestream",
      privileges: {
        standard: true,
        secure: true,
      },
    },
  ]);
}

/**
 * Handle OAuth callback URL
 * Called when browser redirects to writestream://auth/callback?code=...
 */
async function handleOAuthCallback(url: string) {
  console.log("[OAuth] Received callback:", url);

  try {
    // Parse the callback URL
    const parsedUrl = new URL(url);
    const params = parsedUrl.searchParams;

    // Extract OAuth parameters
    const code = params.get("code");
    const state = params.get("state");
    const error = params.get("error");
    const errorDescription = params.get("error_description");

    // TODO: Determine which platform this callback is for
    // For now, we'd need to store the state -> platformId mapping
    // This would be done in the OAuth service when starting the flow

    console.log("[OAuth] Callback data:", { code, state, error });

    // The actual handling would be done via IPC from the renderer
    // or we could emit an event that the renderer listens to
    if (mainWindow) {
      mainWindow.webContents.send("oauth-callback", {
        code,
        state,
        error,
        errorDescription,
      });
    }
  } catch (error) {
    console.error("[OAuth] Failed to handle callback:", error);
  }
}

// Register custom protocol before app is ready
registerOAuthProtocol();

// Called when Electron has finished initialization and is ready to create browser windows.
app.on("ready", async () => {
  // Initialize token store
  await getTokenStore();

  // Handle deep links (OAuth callbacks)
  protocol.handle("writestream", async (request) => {
    const url = request.url;
    await handleOAuthCallback(url);

    // Return a simple HTML page confirming authentication
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Authentication Complete</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              padding: 40px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 20px;
              backdrop-filter: blur(10px);
            }
            h1 { margin: 0 0 20px 0; }
            p { margin: 0; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>✓ Authentication Complete</h1>
            <p>You can close this window and return to Writestream.</p>
          </div>
        </body>
      </html>
      `,
      {
        headers: { "content-type": "text/html" },
      }
    );
  });

  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
