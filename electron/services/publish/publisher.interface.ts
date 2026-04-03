/**
 * Publisher Interface
 *
 * Defines the contract that all platform publishers must implement.
 * This allows us to add new platforms by simply creating a new class
 * that implements this interface.
 *
 * To add a new platform:
 * 1. Create a new file: <platform>.publisher.ts
 * 2. Implement this interface
 * 3. Add platform config to shared/constants/platforms.ts
 * 4. Register the publisher in the publish IPC handler
 */

import {
  PublishableContent,
  PublishResult,
  OAuthToken,
} from "../../../shared/types/platform.types";

/**
 * Base Publisher Interface
 * Every platform publisher must implement these methods
 */
export interface IPublisher {
  /**
   * Publish content to the platform
   *
   * @param content - The content to publish (title, body, metadata)
   * @param token - OAuth token or API key for authentication
   * @returns Result with URL of published content or error
   */
  publish(content: PublishableContent, token: OAuthToken | string): Promise<PublishResult>;

  /**
   * Validate that we can publish to this platform
   * Checks authentication and any platform-specific requirements
   *
   * @param token - OAuth token or API key
   * @returns true if ready to publish, false otherwise
   */
  validateAuth(token: OAuthToken | string): Promise<boolean>;

  /**
   * Get user info from the platform
   * Used to display which account is connected
   *
   * @param token - OAuth token or API key
   * @returns User info (name, username, avatar)
   */
  getUserInfo(token: OAuthToken | string): Promise<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  }>;
}

/**
 * Abstract base class for publishers
 * Provides common functionality that all publishers can use
 */
export abstract class BasePublisher implements IPublisher {
  /**
   * Make an authenticated API request
   *
   * @param url - API endpoint URL
   * @param token - OAuth token or API key
   * @param options - Fetch options (method, body, headers)
   * @returns Response data
   */
  protected async makeAuthenticatedRequest(
    url: string,
    token: OAuthToken | string,
    options: RequestInit = {}
  ): Promise<any> {
    // Determine how to authenticate based on token type
    const authHeader = this.buildAuthHeader(token);

    // Merge headers
    const headers = {
      "Content-Type": "application/json",
      ...authHeader,
      ...(options.headers || {}),
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Check for errors
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[Publisher] Request failed:`, error);
      throw error;
    }
  }

  /**
   * Build authorization header based on token type
   *
   * @param token - OAuth token or API key string
   * @returns Authorization header object
   */
  private buildAuthHeader(token: OAuthToken | string): Record<string, string> {
    // If token is a string, it's a simple API key
    if (typeof token === "string") {
      return { Authorization: `Bearer ${token}` };
    }

    // If token is an OAuthToken object, use the access token
    return { Authorization: `${token.tokenType} ${token.accessToken}` };
  }

  /**
   * Convert markdown to HTML if needed
   * Some platforms accept markdown, others need HTML
   *
   * @param content - Content in markdown format
   * @returns HTML content
   */
  protected markdownToHtml(content: string): string {
    // TODO: Use a proper markdown library (marked, markdown-it, etc.)
    // For now, this is a placeholder
    return content;
  }

  /**
   * Abstract methods that each publisher must implement
   */
  abstract publish(
    content: PublishableContent,
    token: OAuthToken | string
  ): Promise<PublishResult>;

  abstract validateAuth(token: OAuthToken | string): Promise<boolean>;

  abstract getUserInfo(token: OAuthToken | string): Promise<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  }>;
}
