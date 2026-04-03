/**
 * Medium Publisher
 *
 * Publishes content to Medium using their API.
 *
 * Authentication: Medium uses self-issued integration tokens (not OAuth)
 * Users get their token from: https://medium.com/me/settings/security
 *
 * API Docs: https://github.com/Medium/medium-api-docs
 *
 * Note: Medium's API is limited:
 * - Can only post to user's own account (not publications)
 * - Supports markdown and HTML
 * - Limited metadata (tags, publish status, canonical URL)
 */

import { BasePublisher } from "./publisher.interface";
import {
  PublishableContent,
  PublishResult,
  PublishStatus,
  OAuthToken,
} from "../../../shared/types/platform.types";
import { getPlatformConfig } from "../../../shared/constants/platforms";

/**
 * Medium API response types
 */
interface MediumUser {
  id: string;
  username: string;
  name: string;
  url: string;
  imageUrl: string;
}

interface MediumPost {
  id: string;
  title: string;
  authorId: string;
  url: string;
  canonicalUrl: string;
  publishStatus: string;
  publishedAt: number;
  license: string;
  licenseUrl: string;
}

/**
 * Medium Publisher Implementation
 */
export class MediumPublisher extends BasePublisher {
  private platformConfig = getPlatformConfig("medium")!;
  private userId: string | null = null; // Cached user ID

  /**
   * Publish content to Medium
   *
   * @param content - Content to publish
   * @param token - Medium integration token (string)
   * @returns Result with URL of published post
   */
  async publish(content: PublishableContent, token: OAuthToken | string): Promise<PublishResult> {
    try {
      // Ensure we have the user ID (needed for API endpoint)
      if (!this.userId) {
        const user = await this.getUserInfo(token);
        this.userId = user.id;
      }

      // Build the API endpoint URL
      // Replace {{userId}} placeholder with actual user ID
      const endpoint = this.platformConfig.api.publishEndpoint.replace(
        "{{userId}}",
        this.userId
      );
      const url = `${this.platformConfig.api.baseUrl}${endpoint}`;

      // Get publish status from metadata or default to "public"
      const publishStatus = content.metadata?.publishStatus || "public";

      // Prepare post data according to Medium API spec
      const postData = {
        title: content.title,
        contentFormat: "markdown", // Medium accepts markdown or html
        content: content.content,
        tags: content.tags || [],
        publishStatus: publishStatus, // "public", "draft", or "unlisted"
        canonicalUrl: content.canonicalUrl, // Optional: original URL if cross-posting
      };

      console.log(`[Medium] Publishing post: ${content.title}`);

      // Make the API request
      const response = await this.makeAuthenticatedRequest(url, token, {
        method: "POST",
        body: JSON.stringify(postData),
      });

      // Extract post data from response
      const post: MediumPost = response.data;

      console.log(`[Medium] Published successfully: ${post.url}`);

      return {
        platformId: "medium",
        status: PublishStatus.SUCCESS,
        url: post.url,
        publishedAt: post.publishedAt,
      };
    } catch (error: any) {
      console.error(`[Medium] Publish failed:`, error);

      return {
        platformId: "medium",
        status: PublishStatus.FAILED,
        error: error.message || "Unknown error",
      };
    }
  }

  /**
   * Validate Medium authentication token
   *
   * @param token - Medium integration token
   * @returns true if token is valid
   */
  async validateAuth(token: OAuthToken | string): Promise<boolean> {
    try {
      // Try to get user info - if it works, token is valid
      await this.getUserInfo(token);
      return true;
    } catch (error) {
      console.error(`[Medium] Auth validation failed:`, error);
      return false;
    }
  }

  /**
   * Get Medium user information
   *
   * @param token - Medium integration token
   * @returns User info
   */
  async getUserInfo(token: OAuthToken | string): Promise<{
    id: string;
    name: string;
    username?: string;
    avatarUrl?: string;
  }> {
    const url = `${this.platformConfig.api.baseUrl}/me`;

    console.log(`[Medium] Fetching user info`);

    const response = await this.makeAuthenticatedRequest(url, token, {
      method: "GET",
    });

    const user: MediumUser = response.data;

    // Cache user ID for later use
    this.userId = user.id;

    return {
      id: user.id,
      name: user.name,
      username: user.username,
      avatarUrl: user.imageUrl,
    };
  }
}
