/**
 * SqliteUserStore Unit Tests
 */

import { SqliteUserStore } from '../../src/data/SqliteUserStore';
import { MoChatDatabase } from '../../src/data/Database';
import { UserType } from '../../src/types';
import { unlinkSync } from 'fs';
import { join } from 'path';

describe('SqliteUserStore', () => {
  let db: MoChatDatabase;
  let store: SqliteUserStore;
  const testDbPath = join(__dirname, '../../data/test.db');

  beforeEach(() => {
    // Clean up any existing test database
    try {
      unlinkSync(testDbPath);
    } catch (e) {
      // File doesn't exist, that's fine
    }

    db = new MoChatDatabase(testDbPath);
    store = new SqliteUserStore(db.getDb());
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('createUser', () => {
    it('should create a human user', () => {
      const user = {
        id: 'user-1',
        type: UserType.HUMAN,
        username: 'testuser',
        email: 'test@example.com',
        displayName: 'Test User',
        avatar: 'https://example.com/avatar.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = store.createUser(user);
      expect(created).toEqual(user);

      const retrieved = store.getUserById('user-1');
      expect(retrieved).toBeDefined();
      expect(retrieved?.username).toBe('testuser');
      expect(retrieved?.email).toBe('test@example.com');
    });

    it('should persist user data', () => {
      const user = {
        id: 'user-2',
        type: UserType.HUMAN,
        username: 'persistent',
        email: 'persist@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.createUser(user);

      // Create a new store instance with the same database
      const newStore = new SqliteUserStore(db.getDb());
      const retrieved = newStore.getUserById('user-2');

      expect(retrieved).toBeDefined();
      expect(retrieved?.username).toBe('persistent');
    });
  });

  describe('createAgent', () => {
    it('should create an agent with token', () => {
      const agent = {
        id: 'agent-1',
        type: UserType.AGENT,
        username: 'testagent',
        email: 'agent@example.com',
        token: 'claw_test_token_123',
        ownerId: 'owner-1',
        workspaceId: 'workspace-1',
        groupId: 'group-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = store.createAgent(agent);
      expect(created.id).toBe('agent-1');
      expect(created.token).toBe('claw_test_token_123');

      const retrieved = store.getUserById('agent-1');
      expect(retrieved).toBeDefined();
      expect((retrieved as any).isActive).toBe(true);
    });

    it('should retrieve agent by token', () => {
      const agent = {
        id: 'agent-2',
        type: UserType.AGENT,
        username: 'tokenagent',
        token: 'claw_unique_token_456',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.createAgent(agent);

      const retrieved = store.getAgentByToken('claw_unique_token_456');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('agent-2');
      expect(retrieved?.username).toBe('tokenagent');
    });
  });

  describe('getUserById', () => {
    it('should return user if exists', () => {
      const user = {
        id: 'user-3',
        type: UserType.HUMAN,
        username: 'findme',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.createUser(user);
      const found = store.getUserById('user-3');

      expect(found).toBeDefined();
      expect(found?.username).toBe('findme');
    });

    it('should return undefined if user does not exist', () => {
      const found = store.getUserById('nonexistent');
      expect(found).toBeUndefined();
    });
  });

  describe('getUserByEmail', () => {
    it('should find user by email (case insensitive)', () => {
      const user = {
        id: 'user-4',
        type: UserType.HUMAN,
        username: 'emailuser',
        email: 'Email@Example.Com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.createUser(user);

      const found1 = store.getUserByEmail('email@example.com');
      expect(found1).toBeDefined();
      expect(found1?.id).toBe('user-4');

      const found2 = store.getUserByEmail('EMAIL@EXAMPLE.COM');
      expect(found2).toBeDefined();
      expect(found2?.id).toBe('user-4');
    });

    it('should return undefined for non-existent email', () => {
      const found = store.getUserByEmail('notfound@example.com');
      expect(found).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should update user fields', () => {
      const user = {
        id: 'user-5',
        type: UserType.HUMAN,
        username: 'original',
        email: 'original@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.createUser(user);

      const updated = store.updateUser('user-5', {
        username: 'updated',
        displayName: 'Updated User',
      });

      expect(updated).toBeDefined();
      expect(updated?.username).toBe('updated');
      expect(updated?.displayName).toBe('Updated User');
      expect(updated?.email).toBe('original@example.com');
    });

    it('should return undefined for non-existent user', () => {
      const updated = store.updateUser('nonexistent', { username: 'new' });
      expect(updated).toBeUndefined();
    });
  });

  describe('updateAgentToken', () => {
    it('should update agent token', () => {
      const agent = {
        id: 'agent-3',
        type: UserType.AGENT,
        username: 'tokentest',
        token: 'claw_old_token',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.createAgent(agent);

      const updated = store.updateAgentToken('agent-3', 'claw_new_token');
      expect(updated).toBeDefined();
      expect(updated?.token).toBe('claw_new_token');

      // Old token should not work
      const byOldToken = store.getAgentByToken('claw_old_token');
      expect(byOldToken).toBeUndefined();

      // New token should work
      const byNewToken = store.getAgentByToken('claw_new_token');
      expect(byNewToken).toBeDefined();
      expect(byNewToken?.id).toBe('agent-3');
    });
  });

  describe('deleteUser', () => {
    it('should delete existing user', () => {
      const user = {
        id: 'user-6',
        type: UserType.HUMAN,
        username: 'deleteme',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      store.createUser(user);
      expect(store.getUserById('user-6')).toBeDefined();

      const deleted = store.deleteUser('user-6');
      expect(deleted).toBe(true);
      expect(store.getUserById('user-6')).toBeUndefined();
    });

    it('should return false for non-existent user', () => {
      const deleted = store.deleteUser('nonexistent');
      expect(deleted).toBe(false);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', () => {
      store.createUser({
        id: 'user-7',
        type: UserType.HUMAN,
        username: 'user1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      store.createAgent({
        id: 'agent-4',
        type: UserType.AGENT,
        username: 'agent1',
        token: 'claw_token_1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const all = store.getAllUsers();
      expect(all).toHaveLength(2);
      expect(all.map((u) => u.id)).toContain('user-7');
      expect(all.map((u) => u.id)).toContain('agent-4');
    });
  });

  describe('getAllAgents', () => {
    it('should return only agents', () => {
      store.createUser({
        id: 'user-8',
        type: UserType.HUMAN,
        username: 'human',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      store.createAgent({
        id: 'agent-5',
        type: UserType.AGENT,
        username: 'agent1',
        token: 'claw_token_2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      store.createAgent({
        id: 'agent-6',
        type: UserType.AGENT,
        username: 'agent2',
        token: 'claw_token_3',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const agents = store.getAllAgents();
      expect(agents).toHaveLength(2);
      expect(agents.every((a) => a.type === UserType.AGENT)).toBe(true);
    });
  });

  describe('getAgentsByWorkspace', () => {
    it('should return agents in specific workspace', () => {
      store.createAgent({
        id: 'agent-7',
        type: UserType.AGENT,
        username: 'workspace1agent',
        token: 'claw_token_4',
        workspaceId: 'workspace-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      store.createAgent({
        id: 'agent-8',
        type: UserType.AGENT,
        username: 'workspace2agent',
        token: 'claw_token_5',
        workspaceId: 'workspace-2',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const workspace1Agents = store.getAgentsByWorkspace('workspace-1');
      expect(workspace1Agents).toHaveLength(1);
      expect(workspace1Agents[0].id).toBe('agent-7');
    });
  });

  describe('searchUsers', () => {
    beforeEach(() => {
      store.createUser({
        id: 'user-9',
        type: UserType.HUMAN,
        username: 'john_doe',
        email: 'john@example.com',
        displayName: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      store.createUser({
        id: 'user-10',
        type: UserType.HUMAN,
        username: 'jane_smith',
        email: 'jane@test.com',
        displayName: 'Jane Smith',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    it('should find users by username', () => {
      const results = store.searchUsers('john');
      expect(results).toHaveLength(1);
      expect(results[0].username).toBe('john_doe');
    });

    it('should find users by display name', () => {
      const results = store.searchUsers('smith');
      expect(results).toHaveLength(1);
      expect(results[0].displayName).toBe('Jane Smith');
    });

    it('should find users by email', () => {
      const results = store.searchUsers('test.com');
      expect(results).toHaveLength(1);
      expect(results[0].email).toBe('jane@test.com');
    });

    it('should be case insensitive', () => {
      const results = store.searchUsers('JOHN');
      expect(results).toHaveLength(1);
    });
  });

  describe('clear', () => {
    it('should remove all users', () => {
      store.createUser({
        id: 'user-11',
        type: UserType.HUMAN,
        username: 'cleartest',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(store.getAllUsers()).toHaveLength(1);

      store.clear();

      expect(store.getAllUsers()).toHaveLength(0);
    });
  });

  describe('getUsersByIds', () => {
    it('should return multiple users by IDs', () => {
      store.createUser({
        id: 'user-12',
        type: UserType.HUMAN,
        username: 'user12',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      store.createUser({
        id: 'user-13',
        type: UserType.HUMAN,
        username: 'user13',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const users = store.getUsersByIds(['user-12', 'user-13', 'nonexistent']);
      expect(users).toHaveLength(2);
      expect(users.map((u) => u.id)).toContain('user-12');
      expect(users.map((u) => u.id)).toContain('user-13');
    });

    it('should return empty array for empty input', () => {
      const users = store.getUsersByIds([]);
      expect(users).toHaveLength(0);
    });
  });
});
