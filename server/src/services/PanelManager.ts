/**
 * Panel/Channel Manager Service
 * Handles public channels within workspace groups
 */

import { IUserStore } from '../data/IUserStore';
import { MessageStore } from '../data/MessageStore';
import { MetadataStore } from '../data/MetadataStore';
import { Panel, Message, MessageType, PaginatedResponse } from '../types';
import { generateId } from '../utils/id';
import { extractMentions } from '../utils/mention';
import { AppError } from '../middleware/errorHandler';

export class PanelManager {
  constructor(
    private userStore: IUserStore,
    private messageStore: MessageStore,
    private metadataStore: MetadataStore
  ) {}

  /**
   * Create a new panel
   */
  async createPanel(params: {
    groupId: string;
    name: string;
    description?: string;
    isPublic?: boolean;
    createdBy: string;
    metadata?: Record<string, any>;
  }): Promise<Panel> {
    const group = this.metadataStore.getGroupById(params.groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Check if panel name already exists in group
    const existingPanels = this.metadataStore.getPanelsByGroup(params.groupId);
    if (existingPanels.some(p => p.name === params.name)) {
      throw new AppError(400, 'Panel with this name already exists in group');
    }

    const panel = this.metadataStore.createPanel({
      id: generateId(),
      groupId: params.groupId,
      name: params.name,
      description: params.description,
      isPublic: params.isPublic ?? true,
      participants: [params.createdBy],
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: params.metadata,
    });

    return panel;
  }

  /**
   * Get panel by ID
   */
  async getPanel(panelId: string, userId: string): Promise<Panel> {
    const panel = this.metadataStore.getPanelById(panelId);
    if (!panel) {
      throw new AppError(404, 'Panel not found');
    }

    // Verify user has access (is participant or panel is public)
    if (!panel.isPublic && !panel.participants.includes(userId)) {
      throw new AppError(403, 'You do not have access to this panel');
    }

    return panel;
  }

  /**
   * Get panels by group
   */
  async getPanelsByGroup(groupId: string, userId: string): Promise<Panel[]> {
    const group = this.metadataStore.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const panels = this.metadataStore.getPanelsByGroup(groupId);

    // Filter to only public panels or panels user is participant in
    return panels.filter(
      panel => panel.isPublic || panel.participants.includes(userId)
    );
  }

  /**
   * Update panel
   */
  async updatePanel(
    panelId: string,
    userId: string,
    updates: {
      name?: string;
      description?: string;
      isPublic?: boolean;
    }
  ): Promise<Panel> {
    const panel = this.metadataStore.getPanelById(panelId);
    if (!panel) {
      throw new AppError(404, 'Panel not found');
    }

    // Verify user is creator or participant
    if (panel.createdBy !== userId && !panel.participants.includes(userId)) {
      throw new AppError(403, 'You do not have permission to update this panel');
    }

    const updated = this.metadataStore.updatePanel(panelId, updates);
    if (!updated) {
      throw new AppError(500, 'Failed to update panel');
    }

    return updated;
  }

  /**
   * Delete panel
   */
  async deletePanel(panelId: string, userId: string): Promise<void> {
    const panel = this.metadataStore.getPanelById(panelId);
    if (!panel) {
      throw new AppError(404, 'Panel not found');
    }

    // Verify user is creator
    if (panel.createdBy !== userId) {
      throw new AppError(403, 'Only the panel creator can delete it');
    }

    this.metadataStore.deletePanel(panelId);
  }

  /**
   * Send a message in a panel
   */
  async sendMessage(params: {
    panelId: string;
    senderId: string;
    content: string;
    type?: MessageType;
    replyTo?: string;
    metadata?: Record<string, any>;
  }): Promise<Message> {
    const panel = this.metadataStore.getPanelById(params.panelId);
    if (!panel) {
      throw new AppError(404, 'Panel not found');
    }

    // Verify sender has access
    if (!panel.isPublic && !panel.participants.includes(params.senderId)) {
      throw new AppError(403, 'You do not have access to this panel');
    }

    // Add sender to participants if not already there
    if (!panel.participants.includes(params.senderId)) {
      panel.participants.push(params.senderId);
      this.metadataStore.updatePanel(params.panelId, {
        participants: panel.participants,
      });
    }

    // Extract mentions
    const mentions = extractMentions(params.content);

    const message: Message = {
      id: generateId(),
      panelId: params.panelId,
      senderId: params.senderId,
      content: params.content,
      type: params.type || MessageType.TEXT,
      mentions,
      replyTo: params.replyTo,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: params.metadata,
    };

    this.messageStore.createMessage(message);

    return message;
  }

  /**
   * Get messages in a panel
   */
  async getMessages(
    panelId: string,
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      before?: Date;
      after?: Date;
    } = {}
  ): Promise<PaginatedResponse<Message>> {
    const panel = this.metadataStore.getPanelById(panelId);
    if (!panel) {
      throw new AppError(404, 'Panel not found');
    }

    // Verify user has access
    if (!panel.isPublic && !panel.participants.includes(userId)) {
      throw new AppError(403, 'You do not have access to this panel');
    }

    return this.messageStore.getPanelMessages(panelId, options);
  }

  /**
   * Join a panel
   */
  async joinPanel(panelId: string, userId: string): Promise<Panel> {
    const panel = this.metadataStore.getPanelById(panelId);
    if (!panel) {
      throw new AppError(404, 'Panel not found');
    }

    if (!panel.isPublic) {
      throw new AppError(403, 'Cannot join private panel');
    }

    if (panel.participants.includes(userId)) {
      return panel; // Already a participant
    }

    const updated = this.metadataStore.updatePanel(panelId, {
      participants: [...panel.participants, userId],
    });

    if (!updated) {
      throw new AppError(500, 'Failed to join panel');
    }

    return updated;
  }

  /**
   * Leave a panel
   */
  async leavePanel(panelId: string, userId: string): Promise<void> {
    const panel = this.metadataStore.getPanelById(panelId);
    if (!panel) {
      throw new AppError(404, 'Panel not found');
    }

    if (!panel.participants.includes(userId)) {
      return; // Not a participant
    }

    const updatedParticipants = panel.participants.filter(id => id !== userId);

    this.metadataStore.updatePanel(panelId, {
      participants: updatedParticipants,
    });
  }
}
