/**
 * Unit tests for UserStore
 */

import { UserStore } from '../../src/data/UserStore';
import { UserType, Agent, Human } from '../../src/types';

describe('UserStore', () => {
  let userStore: UserStore;

  beforeEach(() => {
    userStore = new UserStore();
  });

  describe('createUser', () => {
    it('should create a human user', () => {
      const user: Human = {
        id: 'user1',
        type: UserType.HUMAN,
        username: 'john_doe',
        email: 'john@example.com',
        displayName: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = userStore.createUser(user);
      expect(created).toEqual(user);
      expect(userStore.getUserById('user1')).toEqual(user);
    });
  });

  describe('createAgent', () => {
    it('should create an agent', () => {
      const agent: Agent = {
        id: 'agent1',
        type: UserType.AGENT,
        username: 'test_agent',
        displayName: 'Test Agent',
        token: 'claw_test123',
        workspaceId: 'workspace1',
        groupId: 'group1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const created = userStore.createAgent(agent);
      expect(created).toEqual(agent);
      expect(userStore.getAgentByToken('claw_test123')).toEqual(agent);
    });
  });

  describe('getUserByEmail', () => {
    it('should find user by email (case insensitive)', () => {
      const user: Human = {
        id: 'user1',
        type: UserType.HUMAN,
        username: 'john_doe',
        email: 'John@Example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userStore.createUser(user);
      expect(userStore.getUserByEmail('john@example.com')).toEqual(user);
      expect(userStore.getUserByEmail('JOHN@EXAMPLE.COM')).toEqual(user);
    });

    it('should return undefined for non-existent email', () => {
      expect(userStore.getUserByEmail('notfound@example.com')).toBeUndefined();
    });
  });

  describe('updateUser', () => {
    it('should update user fields', () => {
      const user: Human = {
        id: 'user1',
        type: UserType.HUMAN,
        username: 'john_doe',
        displayName: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userStore.createUser(user);

      const updated = userStore.updateUser('user1', {
        displayName: 'Johnny Doe',
      });

      expect(updated?.displayName).toBe('Johnny Doe');
      expect(updated?.username).toBe('john_doe');
    });
  });

  describe('updateAgentToken', () => {
    it('should update agent token', () => {
      const agent: Agent = {
        id: 'agent1',
        type: UserType.AGENT,
        username: 'test_agent',
        token: 'claw_old',
        workspaceId: 'workspace1',
        groupId: 'group1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userStore.createAgent(agent);

      const updated = userStore.updateAgentToken('agent1', 'claw_new');
      expect(updated?.token).toBe('claw_new');
      expect(userStore.getAgentByToken('claw_new')).toEqual(updated);
      expect(userStore.getAgentByToken('claw_old')).toBeUndefined();
    });
  });

  describe('searchUsers', () => {
    it('should search users by username, displayName, or email', () => {
      userStore.createUser({
        id: 'user1',
        type: UserType.HUMAN,
        username: 'alice',
        displayName: 'Alice Smith',
        email: 'alice@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      userStore.createUser({
        id: 'user2',
        type: UserType.HUMAN,
        username: 'bob',
        displayName: 'Bob Johnson',
        email: 'bob@example.com',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const results = userStore.searchUsers('alice');
      expect(results).toHaveLength(1);
      expect(results[0].username).toBe('alice');
    });
  });

  describe('deleteUser', () => {
    it('should delete user and clean up indexes', () => {
      const agent: Agent = {
        id: 'agent1',
        type: UserType.AGENT,
        username: 'test_agent',
        email: 'agent@example.com',
        token: 'claw_test',
        workspaceId: 'workspace1',
        groupId: 'group1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      userStore.createAgent(agent);
      expect(userStore.deleteUser('agent1')).toBe(true);
      expect(userStore.getUserById('agent1')).toBeUndefined();
      expect(userStore.getAgentByToken('claw_test')).toBeUndefined();
      expect(userStore.getUserByEmail('agent@example.com')).toBeUndefined();
    });
  });
});
