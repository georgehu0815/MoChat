/**
 * SQLite-backed User Store
 */

import Database from 'better-sqlite3';
import { User, Agent, UserType } from '../types';
import { IUserStore } from './IUserStore';

export class SqliteUserStore implements IUserStore {
  constructor(private db: Database.Database) {}

  /**
   * Create a new user
   */
  createUser(user: User): User {
    const stmt = this.db.prepare(`
      INSERT INTO users (
        id, type, username, email, displayName, avatar,
        token, ownerId, workspaceId, groupId, isActive,
        metadata, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const agent = user as Agent;
    stmt.run(
      user.id,
      user.type,
      user.username,
      user.email || null,
      user.displayName || null,
      user.avatar || null,
      agent.token || null,
      agent.ownerId || null,
      agent.workspaceId || null,
      agent.groupId || null,
      agent.isActive ? 1 : 0,
      user.metadata ? JSON.stringify(user.metadata) : null,
      user.createdAt.getTime(),
      user.updatedAt.getTime()
    );

    return user;
  }

  /**
   * Create an agent
   */
  createAgent(agent: Agent): Agent {
    return this.createUser(agent) as Agent;
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): User | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(userId) as any;
    return row ? this.rowToUser(row) : undefined;
  }

  /**
   * Get user by email
   */
  getUserByEmail(email: string): User | undefined {
    const stmt = this.db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)');
    const row = stmt.get(email) as any;
    return row ? this.rowToUser(row) : undefined;
  }

  /**
   * Get agent by token
   */
  getAgentByToken(token: string): Agent | undefined {
    const stmt = this.db.prepare(
      'SELECT * FROM users WHERE token = ? AND type = ?'
    );
    const row = stmt.get(token, UserType.AGENT) as any;
    return row ? (this.rowToUser(row) as Agent) : undefined;
  }

  /**
   * Update user
   */
  updateUser(userId: string, updates: Partial<User>): User | undefined {
    const user = this.getUserById(userId);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    const agent = updatedUser as Agent;

    const stmt = this.db.prepare(`
      UPDATE users SET
        username = ?,
        email = ?,
        displayName = ?,
        avatar = ?,
        token = ?,
        ownerId = ?,
        workspaceId = ?,
        groupId = ?,
        isActive = ?,
        metadata = ?,
        updatedAt = ?
      WHERE id = ?
    `);

    stmt.run(
      updatedUser.username,
      updatedUser.email || null,
      updatedUser.displayName || null,
      updatedUser.avatar || null,
      agent.token || null,
      agent.ownerId || null,
      agent.workspaceId || null,
      agent.groupId || null,
      agent.isActive ? 1 : 0,
      updatedUser.metadata ? JSON.stringify(updatedUser.metadata) : null,
      updatedUser.updatedAt.getTime(),
      userId
    );

    return updatedUser;
  }

  /**
   * Update agent token
   */
  updateAgentToken(agentId: string, newToken: string): Agent | undefined {
    const agent = this.getUserById(agentId);
    if (!agent || agent.type !== UserType.AGENT) return undefined;

    const stmt = this.db.prepare(`
      UPDATE users SET token = ?, updatedAt = ? WHERE id = ?
    `);

    stmt.run(newToken, Date.now(), agentId);

    return this.getUserById(agentId) as Agent;
  }

  /**
   * Delete user
   */
  deleteUser(userId: string): boolean {
    const stmt = this.db.prepare('DELETE FROM users WHERE id = ?');
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  /**
   * Get all users
   */
  getAllUsers(): User[] {
    const stmt = this.db.prepare('SELECT * FROM users');
    const rows = stmt.all() as any[];
    return rows.map(row => this.rowToUser(row));
  }

  /**
   * Get users by IDs
   */
  getUsersByIds(userIds: string[]): User[] {
    if (userIds.length === 0) return [];

    const placeholders = userIds.map(() => '?').join(',');
    const stmt = this.db.prepare(
      `SELECT * FROM users WHERE id IN (${placeholders})`
    );
    const rows = stmt.all(...userIds) as any[];
    return rows.map(row => this.rowToUser(row));
  }

  /**
   * Get all agents
   */
  getAllAgents(): Agent[] {
    const stmt = this.db.prepare('SELECT * FROM users WHERE type = ?');
    const rows = stmt.all(UserType.AGENT) as any[];
    return rows.map(row => this.rowToUser(row) as Agent);
  }

  /**
   * Get agents by workspace
   */
  getAgentsByWorkspace(workspaceId: string): Agent[] {
    const stmt = this.db.prepare(
      'SELECT * FROM users WHERE type = ? AND workspaceId = ?'
    );
    const rows = stmt.all(UserType.AGENT, workspaceId) as any[];
    return rows.map(row => this.rowToUser(row) as Agent);
  }

  /**
   * Search users by username
   */
  searchUsers(query: string): User[] {
    const stmt = this.db.prepare(`
      SELECT * FROM users
      WHERE LOWER(username) LIKE LOWER(?)
         OR LOWER(displayName) LIKE LOWER(?)
         OR LOWER(email) LIKE LOWER(?)
    `);
    const pattern = `%${query}%`;
    const rows = stmt.all(pattern, pattern, pattern) as any[];
    return rows.map(row => this.rowToUser(row));
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.db.exec('DELETE FROM users');
  }

  /**
   * Convert database row to User object
   */
  private rowToUser(row: any): User {
    const base = {
      id: row.id,
      type: row.type as UserType,
      username: row.username,
      email: row.email,
      displayName: row.displayName,
      avatar: row.avatar,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };

    if (row.type === UserType.AGENT) {
      return {
        ...base,
        token: row.token,
        ownerId: row.ownerId,
        workspaceId: row.workspaceId,
        groupId: row.groupId,
        isActive: Boolean(row.isActive),
      } as Agent;
    }

    return base;
  }
}
