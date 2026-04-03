/**
 * Token Storage Service
 *
 * Securely stores OAuth tokens in an encrypted SQLite database.
 * Uses AES-256-GCM encryption for sensitive token data.
 *
 * Database location: User's app data directory
 * - macOS: ~/Library/Application Support/writestream/tokens.db
 * - Windows: %APPDATA%/writestream/tokens.db
 * - Linux: ~/.config/writestream/tokens.db
 *
 * NOTE: You'll need to install better-sqlite3:
 * npm install better-sqlite3
 * npm install --save-dev @types/better-sqlite3
 */

import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { OAuthToken, PlatformId } from "../../../shared/types/platform.types";

// TODO: Install better-sqlite3
// For now, this is a mock implementation that will be replaced
// when better-sqlite3 is installed
type Database = any;

/**
 * Encryption helper
 * Uses AES-256-GCM for authenticated encryption
 */
class EncryptionHelper {
  private algorithm = "aes-256-gcm";
  private keyLength = 32; // 256 bits

  /**
   * Get or generate encryption key
   * The key is stored in the OS-specific secure storage location
   */
  private getEncryptionKey(): Buffer {
    const keyPath = path.join(app.getPath("userData"), ".encryption-key");

    // If key exists, read it
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath);
    }

    // Generate new key
    const key = crypto.randomBytes(this.keyLength);
    fs.writeFileSync(keyPath, key, { mode: 0o600 }); // Read/write for owner only

    return key;
  }

  /**
   * Encrypt data
   * @param plaintext - Data to encrypt
   * @returns Encrypted data as base64 string with IV and auth tag
   */
  encrypt(plaintext: string): string {
    const key = this.getEncryptionKey();

    // Generate random initialization vector (IV)
    const iv = crypto.randomBytes(12); // 96 bits for GCM

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    // Encrypt the data
    let encrypted = cipher.update(plaintext, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine IV + authTag + encrypted data
    // Format: IV(12 bytes) + authTag(16 bytes) + encrypted data
    const combined = Buffer.concat([iv, authTag, Buffer.from(encrypted, "hex")]);

    return combined.toString("base64");
  }

  /**
   * Decrypt data
   * @param ciphertext - Encrypted data as base64 string
   * @returns Decrypted plaintext
   */
  decrypt(ciphertext: string): string {
    const key = this.getEncryptionKey();

    // Decode from base64
    const combined = Buffer.from(ciphertext, "base64");

    // Extract components
    const iv = combined.subarray(0, 12);
    const authTag = combined.subarray(12, 28);
    const encrypted = combined.subarray(28);

    // Create decipher
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt the data
    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }
}

/**
 * Token Store
 * Manages secure storage of OAuth tokens in SQLite
 */
export class TokenStore {
  private db: Database | null = null;
  private encryption: EncryptionHelper;

  constructor() {
    this.encryption = new EncryptionHelper();
  }

  /**
   * Initialize the database
   * Creates tables if they don't exist
   */
  async initialize(): Promise<void> {
    // TODO: Uncomment when better-sqlite3 is installed
    /*
    const Database = require('better-sqlite3');
    const dbPath = path.join(app.getPath('userData'), 'tokens.db');

    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Open database
    this.db = new Database(dbPath);

    // Create tokens table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tokens (
        platform_id TEXT PRIMARY KEY,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at INTEGER,
        token_type TEXT NOT NULL,
        scope TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    console.log('[TokenStore] Database initialized at:', dbPath);
    */

    console.log("[TokenStore] Mock implementation - install better-sqlite3 to enable");
  }

  /**
   * Store a token
   * Encrypts sensitive fields before storing
   *
   * @param token - OAuth token to store
   */
  async saveToken(token: OAuthToken): Promise<void> {
    // TODO: Uncomment when better-sqlite3 is installed
    /*
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Encrypt sensitive fields
    const encryptedAccessToken = this.encryption.encrypt(token.accessToken);
    const encryptedRefreshToken = token.refreshToken
      ? this.encryption.encrypt(token.refreshToken)
      : null;

    // Prepare statement
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO tokens (
        platform_id, access_token, refresh_token, expires_at,
        token_type, scope, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Execute
    stmt.run(
      token.platformId,
      encryptedAccessToken,
      encryptedRefreshToken,
      token.expiresAt || null,
      token.tokenType,
      token.scope || null,
      token.createdAt,
      token.updatedAt
    );

    console.log(`[TokenStore] Token saved for platform: ${token.platformId}`);
    */

    console.log(`[TokenStore] Mock: Would save token for ${token.platformId}`);
  }

  /**
   * Retrieve a token for a platform
   * Decrypts sensitive fields after retrieval
   *
   * @param platformId - Platform identifier
   * @returns OAuth token or null if not found
   */
  async getToken(platformId: PlatformId): Promise<OAuthToken | null> {
    // TODO: Uncomment when better-sqlite3 is installed
    /*
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('SELECT * FROM tokens WHERE platform_id = ?');
    const row = stmt.get(platformId);

    if (!row) {
      return null;
    }

    // Decrypt sensitive fields
    const accessToken = this.encryption.decrypt(row.access_token);
    const refreshToken = row.refresh_token
      ? this.encryption.decrypt(row.refresh_token)
      : undefined;

    const token: OAuthToken = {
      platformId: row.platform_id,
      accessToken: accessToken,
      refreshToken: refreshToken,
      expiresAt: row.expires_at || undefined,
      tokenType: row.token_type,
      scope: row.scope || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return token;
    */

    console.log(`[TokenStore] Mock: Would retrieve token for ${platformId}`);
    return null;
  }

  /**
   * Delete a token
   *
   * @param platformId - Platform identifier
   */
  async deleteToken(platformId: PlatformId): Promise<void> {
    // TODO: Uncomment when better-sqlite3 is installed
    /*
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('DELETE FROM tokens WHERE platform_id = ?');
    stmt.run(platformId);

    console.log(`[TokenStore] Token deleted for platform: ${platformId}`);
    */

    console.log(`[TokenStore] Mock: Would delete token for ${platformId}`);
  }

  /**
   * Get all stored tokens
   * @returns Array of all tokens
   */
  async getAllTokens(): Promise<OAuthToken[]> {
    // TODO: Uncomment when better-sqlite3 is installed
    /*
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const stmt = this.db.prepare('SELECT * FROM tokens');
    const rows = stmt.all();

    const tokens: OAuthToken[] = rows.map((row: any) => {
      const accessToken = this.encryption.decrypt(row.access_token);
      const refreshToken = row.refresh_token
        ? this.encryption.decrypt(row.refresh_token)
        : undefined;

      return {
        platformId: row.platform_id,
        accessToken: accessToken,
        refreshToken: refreshToken,
        expiresAt: row.expires_at || undefined,
        tokenType: row.token_type,
        scope: row.scope || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    });

    return tokens;
    */

    console.log(`[TokenStore] Mock: Would retrieve all tokens`);
    return [];
  }

  /**
   * Check if a token exists for a platform
   *
   * @param platformId - Platform identifier
   * @returns true if token exists
   */
  async hasToken(platformId: PlatformId): Promise<boolean> {
    const token = await this.getToken(platformId);
    return token !== null;
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    // TODO: Uncomment when better-sqlite3 is installed
    /*
    if (this.db) {
      this.db.close();
      this.db = null;
      console.log('[TokenStore] Database closed');
    }
    */
  }
}

/**
 * Singleton instance
 */
let tokenStoreInstance: TokenStore | null = null;

/**
 * Get the token store instance
 * Automatically initializes if not already initialized
 */
export async function getTokenStore(): Promise<TokenStore> {
  if (!tokenStoreInstance) {
    tokenStoreInstance = new TokenStore();
    await tokenStoreInstance.initialize();
  }
  return tokenStoreInstance;
}
