/**
 * User Store - Manages agents and human users
 */

import { User, Agent, UserType } from '../types';
import { IUserStore } from './IUserStore';

export class UserStore implements IUserStore {
  private users: Map<string, User> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> userId
  private tokenIndex: Map<string, string> = new Map(); // token -> agentId

  /**
   * Create a new user
   */
  createUser(user: User): User {
    this.users.set(user.id, user);
    if (user.email) {
      this.emailIndex.set(user.email.toLowerCase(), user.id);
    }
    return user;
  }

  /**
   * Create a new agent
   */
  createAgent(agent: Agent): Agent {
    this.users.set(agent.id, agent);
    this.tokenIndex.set(agent.token, agent.id);
    if (agent.email) {
      this.emailIndex.set(agent.email.toLowerCase(), agent.id);
    }
    return agent;
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    return this.users.get(userId);
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | undefined {
    const userId = this.emailIndex.get(email.toLowerCase());
    return userId ? this.users.get(userId) : undefined;
  }

  /**
   * Get agent by token
   */
  getAgentByToken(token: string): Agent | undefined {
    const agentId = this.tokenIndex.get(token);
    if (!agentId) return undefined;

    const user = this.users.get(agentId);
    return user?.type === UserType.AGENT ? (user as Agent) : undefined;
  }

  /**
   * Update user
   */
  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updated = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(userId, updated);

    // Update email index if email changed
    if (updates.email && updates.email !== user.email) {
      if (user.email) {
        this.emailIndex.delete(user.email.toLowerCase());
      }
      this.emailIndex.set(updates.email.toLowerCase(), userId);
    }

    return updated;
  }

  /**
   * Update agent token
   */
  updateAgentToken(agentId: string, newToken: string): Agent | undefined {
    const agent = this.users.get(agentId);
    if (!agent || agent.type !== UserType.AGENT) return undefined;

    const oldToken = (agent as Agent).token;
    this.tokenIndex.delete(oldToken);
    this.tokenIndex.set(newToken, agentId);

    const updated = { ...agent, token: newToken, updatedAt: new Date() } as Agent;
    this.users.set(agentId, updated);

    return updated;
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) return false;

    if (user.email) {
      this.emailIndex.delete(user.email.toLowerCase());
    }

    if (user.type === UserType.AGENT) {
      this.tokenIndex.delete((user as Agent).token);
    }

    return this.users.delete(userId);
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  /**
   * Get users by IDs
   */
  getUsersByIds(userIds: string[]): User[] {
    return userIds
      .map(id => this.users.get(id))
      .filter((user): user is User => user !== undefined);
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    return this.getAllUsers().filter(
      (user): user is Agent => user.type === UserType.AGENT
    );
  }

  /**
   * Get agents by workspace
   */
  getAgentsByWorkspace(workspaceId: string): Agent[] {
    return this.getAllAgents().filter(agent => agent.workspaceId === workspaceId);
  }

  /**
   * Search users by username
   */
  searchUsers(query: string): User[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllUsers().filter(
      user =>
        user.username.toLowerCase().includes(lowerQuery) ||
        user.displayName?.toLowerCase().includes(lowerQuery) ||
        user.email?.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.users.clear();
    this.emailIndex.clear();
    this.tokenIndex.clear();
  }
}
