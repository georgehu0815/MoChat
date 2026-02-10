/**
 * SQLite Database Layer
 * Provides persistent storage for MoChat server
 */

import Database from 'better-sqlite3';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export class MoChatDatabase {
  private db: Database.Database;

  constructor(dbPath: string = './data/mochat.db') {
    // Ensure data directory exists
    const dataDir = join(process.cwd(), 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Open/create database
    this.db = new Database(join(process.cwd(), dbPath), {
      verbose: console.log.bind(console, '[SQL]')
    });

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Initialize schema
    this.initSchema();

    console.log('✓ SQLite database initialized');
  }

  /**
   * Initialize database schema
   */
  private initSchema(): void {
    // Users table (agents and humans)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('human', 'agent')),
        username TEXT NOT NULL UNIQUE,
        email TEXT,
        displayName TEXT,
        avatar TEXT,
        token TEXT UNIQUE,
        ownerId TEXT,
        workspaceId TEXT,
        groupId TEXT,
        isActive INTEGER DEFAULT 1,
        metadata TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_token ON users(token);
      CREATE INDEX IF NOT EXISTS idx_users_type ON users(type);
      CREATE INDEX IF NOT EXISTS idx_users_workspace ON users(workspaceId);
    `);

    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL CHECK(type IN ('dm', 'group')),
        name TEXT,
        createdBy TEXT NOT NULL,
        lastMessageAt INTEGER,
        metadata TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_type ON sessions(type);
      CREATE INDEX IF NOT EXISTS idx_sessions_createdBy ON sessions(createdBy);
    `);

    // Session participants (many-to-many)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS session_participants (
        sessionId TEXT NOT NULL,
        userId TEXT NOT NULL,
        joinedAt INTEGER NOT NULL,
        PRIMARY KEY (sessionId, userId),
        FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_participants_user ON session_participants(userId);
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        sessionId TEXT,
        panelId TEXT,
        senderId TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text' CHECK(type IN ('text', 'system', 'image', 'file')),
        replyTo TEXT,
        metadata TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (senderId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(sessionId, createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_panel ON messages(panelId, createdAt DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(senderId);
    `);

    // Message mentions (many-to-many)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS message_mentions (
        messageId TEXT NOT NULL,
        userId TEXT NOT NULL,
        PRIMARY KEY (messageId, userId),
        FOREIGN KEY (messageId) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_mentions_user ON message_mentions(userId);
    `);

    // Workspaces table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS workspaces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        ownerId TEXT NOT NULL,
        metadata TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (ownerId) REFERENCES users(id)
      );
    `);

    // Groups table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        workspaceId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_groups_workspace ON groups(workspaceId);
    `);

    // Panels table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS panels (
        id TEXT PRIMARY KEY,
        groupId TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        isPublic INTEGER DEFAULT 1,
        createdBy TEXT NOT NULL,
        metadata TEXT,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL,
        FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_panels_group ON panels(groupId);
    `);

    // Panel participants (many-to-many)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS panel_participants (
        panelId TEXT NOT NULL,
        userId TEXT NOT NULL,
        joinedAt INTEGER NOT NULL,
        PRIMARY KEY (panelId, userId),
        FOREIGN KEY (panelId) REFERENCES panels(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_panel_participants_user ON panel_participants(userId);
    `);

    // Subscriptions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT NOT NULL,
        sessionId TEXT,
        panelId TEXT,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE,
        FOREIGN KEY (panelId) REFERENCES panels(id) ON DELETE CASCADE,
        UNIQUE(userId, sessionId, panelId)
      );

      CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(userId);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_session ON subscriptions(sessionId);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_panel ON subscriptions(panelId);
    `);

    // Invite codes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS invite_codes (
        code TEXT PRIMARY KEY,
        workspaceId TEXT NOT NULL,
        groupId TEXT,
        createdBy TEXT NOT NULL,
        expiresAt INTEGER,
        maxUses INTEGER,
        currentUses INTEGER DEFAULT 0,
        createdAt INTEGER NOT NULL,
        FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE,
        FOREIGN KEY (groupId) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (createdBy) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_invite_workspace ON invite_codes(workspaceId);
    `);

    // Statistics view for quick access
    this.db.exec(`
      CREATE VIEW IF NOT EXISTS statistics AS
      SELECT
        (SELECT COUNT(*) FROM users WHERE type = 'agent') as agentCount,
        (SELECT COUNT(*) FROM users WHERE type = 'human') as humanCount,
        (SELECT COUNT(*) FROM sessions) as sessionCount,
        (SELECT COUNT(*) FROM panels) as panelCount,
        (SELECT COUNT(*) FROM messages) as messageCount,
        (SELECT COUNT(*) FROM workspaces) as workspaceCount;
    `);
  }

  /**
   * Get database instance
   */
  getDb(): Database.Database {
    return this.db;
  }

  /**
   * Get statistics
   */
  getStats() {
    return this.db.prepare('SELECT * FROM statistics').get();
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
    console.log('✓ Database connection closed');
  }

  /**
   * Clear all data (for testing)
   */
  clearAll(): void {
    const tables = [
      'message_mentions',
      'messages',
      'session_participants',
      'sessions',
      'panel_participants',
      'panels',
      'groups',
      'workspaces',
      'subscriptions',
      'invite_codes',
      'users'
    ];

    this.db.exec('BEGIN TRANSACTION');
    try {
      tables.forEach(table => {
        this.db.exec(`DELETE FROM ${table}`);
      });
      this.db.exec('COMMIT');
      console.log('✓ Database cleared');
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  /**
   * Run database backup
   */
  backup(backupPath: string): void {
    this.db.backup(backupPath);
    console.log(`✓ Database backed up to ${backupPath}`);
  }
}
