/**
 * Agent Manager Service
 * Handles agent registration, authentication, token rotation, and user binding
 */

import { IUserStore } from '../data/IUserStore';
import { MetadataStore } from '../data/MetadataStore';
import { Agent, User, UserType, SessionType } from '../types';
import { generateToken } from '../utils/token';
import { generateId } from '../utils/id';
import { AppError } from '../middleware/errorHandler';

export class AgentManager {
  constructor(
    private userStore: IUserStore,
    private metadataStore: MetadataStore
  ) {}

  /**
   * Self-register a new agent
   */
  async selfRegister(params: {
    username: string;
    email?: string;
    displayName?: string;
    metadata?: Record<string, any>;
  }): Promise<{
    token: string;
    botUserId: string;
    workspaceId: string;
    groupId: string;
  }> {
    // Check if username already exists
    const existingUsers = this.userStore.searchUsers(params.username);
    if (existingUsers.some(u => u.username === params.username)) {
      throw new AppError(400, 'Username already exists');
    }

    // Check if email already exists
    if (params.email) {
      const existingUser = this.userStore.getUserByEmail(params.email);
      if (existingUser) {
        throw new AppError(400, 'Email already registered');
      }
    }

    // Get or create default workspace
    let workspace = this.metadataStore.getAllWorkspaces()[0];
    if (!workspace) {
      workspace = this.metadataStore.createWorkspace({
        id: generateId(),
        name: 'Default Workspace',
        description: 'Default workspace for all agents',
        ownerId: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Get or create default group
    let group = this.metadataStore.getGroupsByWorkspace(workspace.id)[0];
    if (!group) {
      group = this.metadataStore.createGroup({
        id: generateId(),
        workspaceId: workspace.id,
        name: 'Default Group',
        description: 'Default group for all agents',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Create agent
    const agent: Agent = {
      id: generateId(),
      type: UserType.AGENT,
      username: params.username,
      displayName: params.displayName || params.username,
      email: params.email,
      token: generateToken(),
      workspaceId: workspace.id,
      groupId: group.id,
      isActive: true,
      metadata: params.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.userStore.createAgent(agent);

    return {
      token: agent.token,
      botUserId: agent.id,
      workspaceId: agent.workspaceId,
      groupId: agent.groupId,
    };
  }

  /**
   * Bind agent to a human user by email
   */
  async bind(
    agentId: string,
    params: {
      email: string;
      greeting_msg?: string;
    }
  ): Promise<{
    ownerUserId: string;
    sessionId: string;
    converseId: string;
  }> {
    const agent = this.userStore.getUserById(agentId);
    if (!agent || agent.type !== UserType.AGENT) {
      throw new AppError(404, 'Agent not found');
    }

    // Find or create human user by email
    let owner = this.userStore.getUserByEmail(params.email);
    if (!owner) {
      // Create new human user
      owner = this.userStore.createUser({
        id: generateId(),
        type: UserType.HUMAN,
        username: params.email.split('@')[0],
        email: params.email,
        displayName: params.email.split('@')[0],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Update agent's owner
    this.userStore.updateUser(agentId, {
      ...agent,
      ownerId: owner.id,
    } as Partial<User>);

    // Create or get DM session between agent and owner
    const existingSessions = this.metadataStore
      .getSessionsByUser(agentId)
      .filter(
        session =>
          session.type === SessionType.DM &&
          session.participants.includes(owner.id) &&
          session.participants.includes(agentId)
      );

    let session;
    if (existingSessions.length > 0) {
      session = existingSessions[0];
    } else {
      session = this.metadataStore.createSession({
        id: generateId(),
        type: SessionType.DM,
        participants: [agentId, owner.id],
        createdBy: agentId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return {
      ownerUserId: owner.id,
      sessionId: session.id,
      converseId: session.id, // For compatibility
    };
  }

  /**
   * Rotate agent token
   */
  async rotateToken(agentId: string): Promise<{ token: string }> {
    const agent = this.userStore.getUserById(agentId);
    if (!agent || agent.type !== UserType.AGENT) {
      throw new AppError(404, 'Agent not found');
    }

    const newToken = generateToken();
    this.userStore.updateAgentToken(agentId, newToken);

    return { token: newToken };
  }

  /**
   * Get agent details
   */
  async getAgent(agentId: string): Promise<Agent> {
    const agent = this.userStore.getUserById(agentId);
    if (!agent || agent.type !== UserType.AGENT) {
      throw new AppError(404, 'Agent not found');
    }

    return agent as Agent;
  }

  /**
   * Update agent status
   */
  async updateAgentStatus(agentId: string, isActive: boolean): Promise<Agent> {
    const agent = this.userStore.getUserById(agentId);
    if (!agent || agent.type !== UserType.AGENT) {
      throw new AppError(404, 'Agent not found');
    }

    const updated = this.userStore.updateUser(agentId, {
      ...agent,
      isActive,
    } as Partial<User>);

    if (!updated) {
      throw new AppError(500, 'Failed to update agent status');
    }

    return updated as Agent;
  }

  /**
   * Get all agents in workspace
   */
  async getWorkspaceAgents(workspaceId: string): Promise<Agent[]> {
    return this.userStore.getAgentsByWorkspace(workspaceId);
  }
}
