/**
 * Storage Comparison Tests
 * Ensures SqliteUserStore and UserStore behave identically
 */

import { UserStore } from '../../src/data/UserStore';
import { SqliteUserStore } from '../../src/data/SqliteUserStore';
import { MoChatDatabase } from '../../src/data/Database';
import { IUserStore } from '../../src/data/IUserStore';
import { Agent, UserType } from '../../src/types';
import { unlinkSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';

describe('Storage Comparison: UserStore vs SqliteUserStore', () => {
  let inMemoryStore: IUserStore;
  let sqliteStore: IUserStore;
  let db: MoChatDatabase;
  const testDbPath = join(__dirname, '../../data/comparison-test.db');

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

    inMemoryStore = new UserStore();
    db = new MoChatDatabase(testDbPath);
    sqliteStore = new SqliteUserStore(db.getDb());
  });

  afterEach(() => {
    db.close();
    try {
      unlinkSync(testDbPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  const testWithBothStores = (
    description: string,
    testFn: (store: IUserStore) => void | Promise<void>
  ) => {
    it(`${description} (in-memory)`, async () => await testFn(inMemoryStore));
    it(`${description} (sqlite)`, async () => await testFn(sqliteStore));
  };

  testWithBothStores('should create and retrieve user', (store) => {
    const user = {
      id: 'user-1',
      type: UserType.HUMAN,
      username: 'testuser',
      email: 'test@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.createUser(user);
    const retrieved = store.getUserById('user-1');

    expect(retrieved).toBeDefined();
    expect(retrieved?.username).toBe('testuser');
    expect(retrieved?.email).toBe('test@example.com');
  });

  testWithBothStores('should create and retrieve agent', (store) => {
    const agent: Agent = {
      id: 'agent-1',
      type: UserType.AGENT,
      username: 'testagent',
      token: 'claw_test_token',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.createAgent(agent);
    const retrieved = store.getAgentByToken('claw_test_token');

    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe('agent-1');
    expect(retrieved?.username).toBe('testagent');
  });

  testWithBothStores('should update user', (store) => {
    const user = {
      id: 'user-2',
      type: UserType.HUMAN,
      username: 'original',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.createUser(user);
    const updated = store.updateUser('user-2', { username: 'updated' });

    expect(updated).toBeDefined();
    expect(updated?.username).toBe('updated');
  });

  testWithBothStores('should delete user', (store) => {
    const user = {
      id: 'user-3',
      type: UserType.HUMAN,
      username: 'deleteme',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    store.createUser(user);
    const deleted = store.deleteUser('user-3');

    expect(deleted).toBe(true);
    expect(store.getUserById('user-3')).toBeUndefined();
  });

  testWithBothStores('should search users', (store) => {
    store.createUser({
      id: 'user-4',
      type: UserType.HUMAN,
      username: 'searchable',
      email: 'search@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const results = store.searchUsers('search');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].username).toBe('searchable');
  });

  testWithBothStores('should get all users', (store) => {
    store.createUser({
      id: 'user-5',
      type: UserType.HUMAN,
      username: 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    store.createAgent({
      id: 'agent-2',
      type: UserType.AGENT,
      username: 'agent1',
      token: 'claw_token_1',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const all = store.getAllUsers();
    expect(all.length).toBe(2);
  });

  testWithBothStores('should get all agents', (store) => {
    store.createUser({
      id: 'user-6',
      type: UserType.HUMAN,
      username: 'human',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    store.createAgent({
      id: 'agent-3',
      type: UserType.AGENT,
      username: 'agent',
      token: 'claw_token_2',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const agents = store.getAllAgents();
    expect(agents.length).toBe(1);
    expect(agents[0].type).toBe(UserType.AGENT);
  });

  testWithBothStores('should update agent token', (store) => {
    store.createAgent({
      id: 'agent-4',
      type: UserType.AGENT,
      username: 'tokentest',
      token: 'claw_old',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const updated = store.updateAgentToken('agent-4', 'claw_new');
    expect(updated).toBeDefined();
    expect(updated?.token).toBe('claw_new');

    const byOldToken = store.getAgentByToken('claw_old');
    expect(byOldToken).toBeUndefined();

    const byNewToken = store.getAgentByToken('claw_new');
    expect(byNewToken).toBeDefined();
  });

  testWithBothStores('should clear all data', (store) => {
    store.createUser({
      id: 'user-7',
      type: UserType.HUMAN,
      username: 'cleartest',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(store.getAllUsers().length).toBe(1);
    store.clear();
    expect(store.getAllUsers().length).toBe(0);
  });

  describe('Performance Comparison', () => {
    it('should have comparable performance for bulk operations', () => {
      const count = 100;
      const users = Array.from({ length: count }, (_, i) => ({
        id: `perf-user-${i}`,
        type: UserType.HUMAN,
        username: `perfuser${i}`,
        email: `perf${i}@example.com`,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Test in-memory store
      const inMemoryStart = Date.now();
      users.forEach((user) => inMemoryStore.createUser(user));
      inMemoryStore.getAllUsers();
      const inMemoryTime = Date.now() - inMemoryStart;

      // Test SQLite store
      const sqliteStart = Date.now();
      users.forEach((user) => sqliteStore.createUser(user));
      sqliteStore.getAllUsers();
      const sqliteTime = Date.now() - sqliteStart;

      // SQLite should not be significantly slower (allow 10x difference)
      expect(sqliteTime).toBeLessThan(inMemoryTime * 10);

      console.log(`Performance: In-Memory: ${inMemoryTime}ms, SQLite: ${sqliteTime}ms`);
    });
  });
});
