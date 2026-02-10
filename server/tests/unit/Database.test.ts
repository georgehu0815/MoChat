/**
 * Database Schema Tests
 */

import { MoChatDatabase } from '../../src/data/Database';
import { unlinkSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

describe('MoChatDatabase', () => {
  let db: MoChatDatabase;
  const testDbPath = join(__dirname, '../../data/db-test.db');

  beforeEach(() => {
    // Ensure data directory exists
    const dir = dirname(testDbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    // Clean up any existing test database
    try {
      unlinkSync(testDbPath);
    } catch (e) {
      // File doesn't exist, that's fine
    }

    db = new MoChatDatabase(testDbPath);
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Initialization', () => {
    it('should create database file', () => {
      const fs = require('fs');
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create all required tables', () => {
      const tables = db
        .getDb()
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
        )
        .all() as Array<{ name: string }>;

      const tableNames = tables.map((t) => t.name);

      // Check for essential tables
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('sessions');
      expect(tableNames).toContain('messages');
      expect(tableNames).toContain('panels');
      expect(tableNames).toContain('workspaces');
      expect(tableNames).toContain('groups');
    });

    it('should create statistics view', () => {
      const views = db
        .getDb()
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='view' ORDER BY name"
        )
        .all() as Array<{ name: string }>;

      const viewNames = views.map((v) => v.name);
      expect(viewNames).toContain('statistics');
    });

    it('should enable foreign keys', () => {
      const result = db.getDb().prepare('PRAGMA foreign_keys').get() as {
        foreign_keys: number;
      };
      expect(result.foreign_keys).toBe(1);
    });
  });

  describe('Statistics View', () => {
    it('should return initial statistics', () => {
      const stats = db.getStats() as any;

      expect(stats).toHaveProperty('agentCount');
      expect(stats).toHaveProperty('humanCount');
      expect(stats).toHaveProperty('sessionCount');
      expect(stats).toHaveProperty('panelCount');
      expect(stats).toHaveProperty('messageCount');
      expect(stats).toHaveProperty('workspaceCount');

      // All should be 0 initially
      expect(stats.agentCount).toBe(0);
      expect(stats.humanCount).toBe(0);
      expect(stats.sessionCount).toBe(0);
    });

    it('should update statistics when data is inserted', () => {
      // Insert a user
      db.getDb()
        .prepare(
          `INSERT INTO users (id, type, username, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('user-1', 'human', 'testuser', Date.now(), Date.now());

      const stats = db.getStats() as any;
      expect(stats.humanCount).toBe(1);
    });
  });

  describe('User Table', () => {
    it('should enforce unique username', () => {
      const insertStmt = db
        .getDb()
        .prepare(
          `INSERT INTO users (id, type, username, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        );

      insertStmt.run('user-1', 'human', 'unique', Date.now(), Date.now());

      // Second insert with same username should fail
      expect(() => {
        insertStmt.run('user-2', 'human', 'unique', Date.now(), Date.now());
      }).toThrow();
    });

    it('should allow null email', () => {
      const stmt = db
        .getDb()
        .prepare(
          `INSERT INTO users (id, type, username, email, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`
        );

      expect(() => {
        stmt.run('user-1', 'human', 'user1', null, Date.now(), Date.now());
      }).not.toThrow();
    });

    it('should store agent-specific fields', () => {
      db.getDb()
        .prepare(
          `INSERT INTO users (id, type, username, token, ownerId, workspaceId, groupId, isActive, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'agent-1',
          'agent',
          'testagent',
          'claw_token',
          'owner-1',
          'workspace-1',
          'group-1',
          1,
          Date.now(),
          Date.now()
        );

      const agent = db
        .getDb()
        .prepare('SELECT * FROM users WHERE id = ?')
        .get('agent-1') as any;

      expect(agent.token).toBe('claw_token');
      expect(agent.ownerId).toBe('owner-1');
      expect(agent.workspaceId).toBe('workspace-1');
      expect(agent.isActive).toBe(1);
    });
  });

  describe('Session Table', () => {
    it('should create session', () => {
      db.getDb()
        .prepare(
          `INSERT INTO sessions (id, type, name, createdBy, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          'session-1',
          'dm',
          'Test Session',
          'user-1',
          Date.now(),
          Date.now()
        );

      const session = db
        .getDb()
        .prepare('SELECT * FROM sessions WHERE id = ?')
        .get('session-1') as any;

      expect(session).toBeDefined();
      expect(session.type).toBe('dm');
      expect(session.name).toBe('Test Session');
    });
  });

  describe('Message Table', () => {
    beforeEach(() => {
      // Create a user and session first
      db.getDb()
        .prepare(
          `INSERT INTO users (id, type, username, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('user-1', 'human', 'testuser', Date.now(), Date.now());

      db.getDb()
        .prepare(
          `INSERT INTO sessions (id, type, createdBy, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('session-1', 'dm', 'user-1', Date.now(), Date.now());
    });

    it('should create message', () => {
      db.getDb()
        .prepare(
          `INSERT INTO messages (id, sessionId, senderId, content, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          'message-1',
          'session-1',
          'user-1',
          'Hello, World!',
          Date.now(),
          Date.now()
        );

      const message = db
        .getDb()
        .prepare('SELECT * FROM messages WHERE id = ?')
        .get('message-1') as any;

      expect(message).toBeDefined();
      expect(message.content).toBe('Hello, World!');
    });

    it('should enforce foreign key on senderId', () => {
      expect(() => {
        db.getDb()
          .prepare(
            `INSERT INTO messages (id, sessionId, senderId, content, timestamp)
             VALUES (?, ?, ?, ?, ?)`
          )
          .run(
            'message-1',
            'session-1',
            'nonexistent-user',
            'Test',
            Date.now()
          );
      }).toThrow();
    });
  });

  describe('Workspace Table', () => {
    it('should create workspace', () => {
      // Create owner first
      db.getDb()
        .prepare(
          `INSERT INTO users (id, type, username, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('owner-1', 'human', 'owner', Date.now(), Date.now());

      db.getDb()
        .prepare(
          `INSERT INTO workspaces (id, name, description, ownerId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(
          'workspace-1',
          'Test Workspace',
          'A test workspace',
          'owner-1',
          Date.now(),
          Date.now()
        );

      const workspace = db
        .getDb()
        .prepare('SELECT * FROM workspaces WHERE id = ?')
        .get('workspace-1') as any;

      expect(workspace).toBeDefined();
      expect(workspace.name).toBe('Test Workspace');
      expect(workspace.description).toBe('A test workspace');
    });
  });

  describe('Panel Table', () => {
    beforeEach(() => {
      // Create user, workspace, and group first
      db.getDb()
        .prepare(
          `INSERT INTO users (id, type, username, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('user-1', 'human', 'testuser', Date.now(), Date.now());

      db.getDb()
        .prepare(
          `INSERT INTO workspaces (id, name, ownerId, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('workspace-1', 'Test Workspace', 'user-1', Date.now(), Date.now());

      db.getDb()
        .prepare(
          `INSERT INTO groups (id, workspaceId, name, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?)`
        )
        .run('group-1', 'workspace-1', 'Test Group', Date.now(), Date.now());
    });

    it('should create panel', () => {
      db.getDb()
        .prepare(
          `INSERT INTO panels (id, groupId, name, description, createdBy, createdAt, updatedAt)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'panel-1',
          'group-1',
          'Test Panel',
          'A test panel',
          'user-1',
          Date.now(),
          Date.now()
        );

      const panel = db
        .getDb()
        .prepare('SELECT * FROM panels WHERE id = ?')
        .get('panel-1') as any;

      expect(panel).toBeDefined();
      expect(panel.name).toBe('Test Panel');
    });
  });

  describe('Indexes', () => {
    it('should have indexes on frequently queried columns', () => {
      const indexes = db
        .getDb()
        .prepare("SELECT name FROM sqlite_master WHERE type='index'")
        .all() as Array<{ name: string }>;

      const indexNames = indexes.map((i) => i.name);

      // Check for important indexes
      expect(
        indexNames.some((name) => name.includes('users_email'))
      ).toBe(true);
      expect(
        indexNames.some((name) => name.includes('users_token'))
      ).toBe(true);
    });
  });

  describe('Close', () => {
    it('should close database connection', () => {
      expect(() => {
        db.close();
      }).not.toThrow();
    });
  });
});
