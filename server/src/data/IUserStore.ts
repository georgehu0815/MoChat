/**
 * User Store Interface
 * Common interface for both in-memory and SQLite user stores
 */

import { User, Agent } from '../types';

export interface IUserStore {
  createUser(user: User): User;
  createAgent(agent: Agent): Agent;
  getUserById(userId: string): User | undefined;
  getUserByEmail(email: string): User | undefined;
  getAgentByToken(token: string): Agent | undefined;
  updateUser(userId: string, updates: Partial<User>): User | undefined;
  updateAgentToken(agentId: string, newToken: string): Agent | undefined;
  deleteUser(userId: string): boolean;
  getAllUsers(): User[];
  getUsersByIds(userIds: string[]): User[];
  getAllAgents(): Agent[];
  getAgentsByWorkspace(workspaceId: string): Agent[];
  searchUsers(query: string): User[];
  clear(): void;
}
