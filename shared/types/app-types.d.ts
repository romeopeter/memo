/**
 * Global Type Definitions
 *
 * This file augments the global Window interface to include
 * the Electron APIs exposed via preload.ts
 */

import type {
  PlatformId,
  PublishableContent,
  PublishResult,
  OAuthCallbackData,
} from "./platform.types";

export {};

declare global {
  interface Window {
    electron: {
      // ============================================
      // FILE OPERATIONS
      // ============================================

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

      onFileOpened: (callback: (event: any, data: any) => void) => void;
      onFileSaved: (callback: (event: any, data: any) => void) => void;

      // ============================================
      // AUTHENTICATION
      // ============================================

      auth: {
        /**
         * Start OAuth flow for a platform
         */
        startOAuth: (platformId: PlatformId) => Promise<{
          success: boolean;
          state?: string;
          error?: string;
        }>;

        /**
         * Handle OAuth callback
         */
        handleOAuthCallback: (
          platformId: PlatformId,
          callbackData: OAuthCallbackData
        ) => Promise<{
          success: boolean;
          error?: string;
        }>;

        /**
         * Save API token manually
         */
        saveToken: (platformId: PlatformId, apiToken: string) => Promise<{
          success: boolean;
          error?: string;
        }>;

        /**
         * Get connected platforms
         */
        getConnectedPlatforms: () => Promise<{
          success: boolean;
          platforms: Array<{
            platformId: PlatformId;
            platformName: string;
            user: {
              id: string;
              name: string;
              username?: string;
              avatarUrl?: string;
            };
            connectedAt: number;
          }>;
          error?: string;
        }>;

        /**
         * Disconnect from a platform
         */
        disconnectPlatform: (platformId: PlatformId) => Promise<{
          success: boolean;
          error?: string;
        }>;

        /**
         * Check if connected to a platform
         */
        isConnected: (platformId: PlatformId) => Promise<{
          success: boolean;
          connected: boolean;
        }>;

        /**
         * Listen for OAuth callbacks
         */
        onOAuthCallback: (callback: (event: any, data: OAuthCallbackData) => void) => void;
      };

      // ============================================
      // PUBLISHING
      // ============================================

      publish: {
        /**
         * Publish to a single platform
         */
        toPlatform: (platformId: PlatformId, content: PublishableContent) => Promise<PublishResult>;

        /**
         * Publish to multiple platforms
         */
        toMultiple: (
          platformIds: PlatformId[],
          content: PublishableContent
        ) => Promise<{
          success: boolean;
          results: PublishResult[];
          error?: string;
        }>;
      };
    };
  }
}