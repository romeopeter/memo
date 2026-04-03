/**
 * Preload Script
 *
 * This script runs in a special context that has access to both:
 * 1. Electron/Node.js APIs (like ipcRenderer)
 * 2. The renderer's window object
 *
 * We use contextBridge to safely expose specific APIs to the renderer.
 * This prevents the renderer from having full access to Node.js (security).
 */

import { contextBridge, ipcRenderer } from "electron";
import type { PlatformId, PublishableContent, OAuthCallbackData } from "../shared/types/platform.types";

/**
 * Electron API exposed to renderer
 * Accessible via window.electron in the renderer process
 */
const electronAPI = {
  // ============================================
  // FILE OPERATIONS (existing)
  // ============================================

  saveFile: (filePath: string | null, content: string) =>
    ipcRenderer.invoke("save-file", filePath, content),

  openFile: () => ipcRenderer.invoke("open-file"),

  newFile: () => ipcRenderer.invoke("new-file"),

  // Listen for file events from main process
  onFileOpened: (callback: (event: Electron.IpcRendererEvent, data: any) => void) =>
    ipcRenderer.on("file-opened", callback),

  onFileSaved: (callback: (event: Electron.IpcRendererEvent, data: any) => void) =>
    ipcRenderer.on("file-saved", callback),

  // ============================================
  // AUTHENTICATION
  // ============================================

  auth: {
    /**
     * Start OAuth flow for a platform
     * Opens browser window for user to authenticate
     *
     * @param platformId - Platform to authenticate with (e.g., "linkedin")
     * @returns Promise with success status and state parameter
     */
    startOAuth: (platformId: PlatformId) =>
      ipcRenderer.invoke("auth:start-oauth", platformId),

    /**
     * Handle OAuth callback
     * Called after user completes OAuth flow in browser
     *
     * @param platformId - Platform being authenticated
     * @param callbackData - Data from OAuth redirect (code, state, error)
     * @returns Promise with success status
     */
    handleOAuthCallback: (platformId: PlatformId, callbackData: OAuthCallbackData) =>
      ipcRenderer.invoke("auth:handle-oauth-callback", platformId, callbackData),

    /**
     * Save an API token manually (for platforms like Medium)
     * User provides token from platform's developer settings
     *
     * @param platformId - Platform (e.g., "medium")
     * @param apiToken - The API token
     * @returns Promise with success status
     */
    saveToken: (platformId: PlatformId, apiToken: string) =>
      ipcRenderer.invoke("auth:save-token", platformId, apiToken),

    /**
     * Get list of connected platforms
     * Returns platforms that have valid authentication tokens
     *
     * @returns Promise with array of connected platforms and user info
     */
    getConnectedPlatforms: () => ipcRenderer.invoke("auth:get-connected-platforms"),

    /**
     * Disconnect from a platform
     * Removes stored authentication token
     *
     * @param platformId - Platform to disconnect
     * @returns Promise with success status
     */
    disconnectPlatform: (platformId: PlatformId) =>
      ipcRenderer.invoke("auth:disconnect-platform", platformId),

    /**
     * Check if connected to a platform
     *
     * @param platformId - Platform to check
     * @returns Promise with connection status
     */
    isConnected: (platformId: PlatformId) => ipcRenderer.invoke("auth:is-connected", platformId),

    /**
     * Listen for OAuth callback events
     * Triggered when browser redirects back to the app
     */
    onOAuthCallback: (callback: (event: Electron.IpcRendererEvent, data: OAuthCallbackData) => void) =>
      ipcRenderer.on("oauth-callback", callback),
  },

  // ============================================
  // PUBLISHING
  // ============================================

  publish: {
    /**
     * Publish content to a single platform
     *
     * @param platformId - Platform to publish to
     * @param content - Content to publish (title, body, metadata)
     * @returns Promise with publish result (URL or error)
     */
    toPlatform: (platformId: PlatformId, content: PublishableContent) =>
      ipcRenderer.invoke("publish:to-platform", platformId, content),

    /**
     * Publish content to multiple platforms at once
     *
     * @param platformIds - Array of platforms to publish to
     * @param content - Content to publish
     * @returns Promise with array of results for each platform
     */
    toMultiple: (platformIds: PlatformId[], content: PublishableContent) =>
      ipcRenderer.invoke("publish:to-multiple", platformIds, content),
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld("electron", electronAPI);

// Export the type for TypeScript
export type ElectronAPI = typeof electronAPI;
