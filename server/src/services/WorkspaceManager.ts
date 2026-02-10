/**
 * Workspace Manager Service
 * Handles workspaces, groups, permissions, and invite codes
 */

import { MetadataStore } from '../data/MetadataStore';
import { IUserStore } from '../data/IUserStore';
import { Workspace, Group, InviteCode } from '../types';
import { generateId, generateInviteCode } from '../utils/id';
import { AppError } from '../middleware/errorHandler';

export class WorkspaceManager {
  constructor(
    private metadataStore: MetadataStore,
    private userStore: IUserStore
  ) {}

  /**
   * Create a new workspace
   */
  async createWorkspace(params: {
    name: string;
    description?: string;
    ownerId: string;
    metadata?: Record<string, any>;
  }): Promise<Workspace> {
    const workspace = this.metadataStore.createWorkspace({
      id: generateId(),
      name: params.name,
      description: params.description,
      ownerId: params.ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: params.metadata,
    });

    return workspace;
  }

  /**
   * Get workspace by ID
   */
  async getWorkspace(workspaceId: string): Promise<Workspace> {
    const workspace = this.metadataStore.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new AppError(404, 'Workspace not found');
    }

    return workspace;
  }

  /**
   * Get all workspaces
   */
  async getAllWorkspaces(): Promise<Workspace[]> {
    return this.metadataStore.getAllWorkspaces();
  }

  /**
   * Update workspace
   */
  async updateWorkspace(
    workspaceId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
    }
  ): Promise<Workspace> {
    const workspace = this.metadataStore.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new AppError(404, 'Workspace not found');
    }

    // Verify user is owner
    if (workspace.ownerId !== userId) {
      throw new AppError(403, 'Only workspace owner can update it');
    }

    const updated = this.metadataStore.updateWorkspace(workspaceId, updates);
    if (!updated) {
      throw new AppError(500, 'Failed to update workspace');
    }

    return updated;
  }

  /**
   * Create a new group within workspace
   */
  async createGroup(params: {
    workspaceId: string;
    name: string;
    description?: string;
  }): Promise<Group> {
    const workspace = this.metadataStore.getWorkspaceById(params.workspaceId);
    if (!workspace) {
      throw new AppError(404, 'Workspace not found');
    }

    const group = this.metadataStore.createGroup({
      id: generateId(),
      workspaceId: params.workspaceId,
      name: params.name,
      description: params.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return group;
  }

  /**
   * Get group by ID
   */
  async getGroup(groupId: string): Promise<Group> {
    const group = this.metadataStore.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    return group;
  }

  /**
   * Get groups by workspace
   */
  async getGroupsByWorkspace(workspaceId: string): Promise<Group[]> {
    const workspace = this.metadataStore.getWorkspaceById(workspaceId);
    if (!workspace) {
      throw new AppError(404, 'Workspace not found');
    }

    return this.metadataStore.getGroupsByWorkspace(workspaceId);
  }

  /**
   * Update group
   */
  async updateGroup(
    groupId: string,
    updates: {
      name?: string;
      description?: string;
    }
  ): Promise<Group> {
    const group = this.metadataStore.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const updated = this.metadataStore.updateGroup(groupId, updates);
    if (!updated) {
      throw new AppError(500, 'Failed to update group');
    }

    return updated;
  }

  /**
   * Create an invite code for workspace/group
   */
  async createInvite(params: {
    workspaceId: string;
    groupId?: string;
    createdBy: string;
    expiresAt?: Date;
    maxUses?: number;
  }): Promise<InviteCode> {
    const workspace = this.metadataStore.getWorkspaceById(params.workspaceId);
    if (!workspace) {
      throw new AppError(404, 'Workspace not found');
    }

    if (params.groupId) {
      const group = this.metadataStore.getGroupById(params.groupId);
      if (!group || group.workspaceId !== params.workspaceId) {
        throw new AppError(404, 'Group not found in workspace');
      }
    }

    const inviteCode: InviteCode = {
      code: generateInviteCode(),
      workspaceId: params.workspaceId,
      groupId: params.groupId,
      createdBy: params.createdBy,
      expiresAt: params.expiresAt,
      maxUses: params.maxUses,
      currentUses: 0,
      createdAt: new Date(),
    };

    this.metadataStore.createInviteCode(inviteCode);

    return inviteCode;
  }

  /**
   * Join workspace/group using invite code
   */
  async joinByInvite(code: string, userId: string): Promise<{
    workspaceId: string;
    groupId?: string;
  }> {
    const inviteCode = this.metadataStore.getInviteCode(code);
    if (!inviteCode) {
      throw new AppError(404, 'Invalid invite code');
    }

    // Check if expired
    if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
      throw new AppError(400, 'Invite code has expired');
    }

    // Check if max uses reached
    if (inviteCode.maxUses && inviteCode.currentUses >= inviteCode.maxUses) {
      throw new AppError(400, 'Invite code has reached maximum uses');
    }

    // Increment usage
    this.metadataStore.updateInviteCode(code, {
      currentUses: inviteCode.currentUses + 1,
    });

    return {
      workspaceId: inviteCode.workspaceId,
      groupId: inviteCode.groupId,
    };
  }

  /**
   * Get workspace with groups and panels
   */
  async getWorkspaceDetail(workspaceId: string): Promise<{
    workspace: Workspace;
    groups: Array<{
      group: Group;
      panels: any[];
    }>;
  }> {
    const workspace = await this.getWorkspace(workspaceId);
    const groups = await this.getGroupsByWorkspace(workspaceId);

    const groupsWithPanels = groups.map(group => ({
      group,
      panels: this.metadataStore.getPanelsByGroup(group.id),
    }));

    return {
      workspace,
      groups: groupsWithPanels,
    };
  }
}
