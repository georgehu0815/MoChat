/**
 * Message Store - Manages chat messages and history
 */

import { Message, PaginatedResponse } from '../types';

export class MessageStore {
  private messages: Map<string, Message> = new Map();
  private sessionMessages: Map<string, string[]> = new Map(); // sessionId -> messageIds[]
  private panelMessages: Map<string, string[]> = new Map(); // panelId -> messageIds[]

  /**
   * Create a new message
   */
  createMessage(message: Message): Message {
    this.messages.set(message.id, message);

    if (message.sessionId) {
      const sessionMsgs = this.sessionMessages.get(message.sessionId) || [];
      sessionMsgs.push(message.id);
      this.sessionMessages.set(message.sessionId, sessionMsgs);
    }

    if (message.panelId) {
      const panelMsgs = this.panelMessages.get(message.panelId) || [];
      panelMsgs.push(message.id);
      this.panelMessages.set(message.panelId, panelMsgs);
    }

    return message;
  }

  /**
   * Get message by ID
   */
  getMessageById(messageId: string): Message | undefined {
    return this.messages.get(messageId);
  }

  /**
   * Get messages for a session with pagination
   */
  getSessionMessages(
    sessionId: string,
    options: {
      limit?: number;
      cursor?: string;
      before?: Date;
      after?: Date;
    } = {}
  ): PaginatedResponse<Message> {
    const messageIds = this.sessionMessages.get(sessionId) || [];
    return this.paginateMessages(messageIds, options);
  }

  /**
   * Get messages for a panel with pagination
   */
  getPanelMessages(
    panelId: string,
    options: {
      limit?: number;
      cursor?: string;
      before?: Date;
      after?: Date;
    } = {}
  ): PaginatedResponse<Message> {
    const messageIds = this.panelMessages.get(panelId) || [];
    return this.paginateMessages(messageIds, options);
  }

  /**
   * Paginate messages
   */
  private paginateMessages(
    messageIds: string[],
    options: {
      limit?: number;
      cursor?: string;
      before?: Date;
      after?: Date;
    }
  ): PaginatedResponse<Message> {
    const limit = options.limit || 50;
    let messages = messageIds
      .map(id => this.messages.get(id))
      .filter((msg): msg is Message => msg !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Filter by date range
    if (options.before) {
      messages = messages.filter(msg => msg.createdAt < options.before!);
    }
    if (options.after) {
      messages = messages.filter(msg => msg.createdAt > options.after!);
    }

    // Handle cursor-based pagination
    if (options.cursor) {
      const cursorIndex = messages.findIndex(msg => msg.id === options.cursor);
      if (cursorIndex !== -1) {
        messages = messages.slice(cursorIndex + 1);
      }
    }

    const items = messages.slice(0, limit);
    const hasMore = messages.length > limit;
    const cursor = hasMore ? items[items.length - 1].id : undefined;

    return {
      items,
      cursor,
      hasMore,
      total: messageIds.length,
    };
  }

  /**
   * Update message
   */
  updateMessage(messageId: string, updates: Partial<Message>): Message | undefined {
    const message = this.messages.get(messageId);
    if (!message) return undefined;

    const updated = { ...message, ...updates, updatedAt: new Date() };
    this.messages.set(messageId, updated);
    return updated;
  }

  /**
   * Delete message
   */
  deleteMessage(messageId: string): boolean {
    const message = this.messages.get(messageId);
    if (!message) return false;

    if (message.sessionId) {
      const sessionMsgs = this.sessionMessages.get(message.sessionId);
      if (sessionMsgs) {
        const index = sessionMsgs.indexOf(messageId);
        if (index !== -1) sessionMsgs.splice(index, 1);
      }
    }

    if (message.panelId) {
      const panelMsgs = this.panelMessages.get(message.panelId);
      if (panelMsgs) {
        const index = panelMsgs.indexOf(messageId);
        if (index !== -1) panelMsgs.splice(index, 1);
      }
    }

    return this.messages.delete(messageId);
  }

  /**
   * Get latest message for a session
   */
  getLatestSessionMessage(sessionId: string): Message | undefined {
    const messageIds = this.sessionMessages.get(sessionId) || [];
    if (messageIds.length === 0) return undefined;

    const messages = messageIds
      .map(id => this.messages.get(id))
      .filter((msg): msg is Message => msg !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return messages[0];
  }

  /**
   * Get latest message for a panel
   */
  getLatestPanelMessage(panelId: string): Message | undefined {
    const messageIds = this.panelMessages.get(panelId) || [];
    if (messageIds.length === 0) return undefined;

    const messages = messageIds
      .map(id => this.messages.get(id))
      .filter((msg): msg is Message => msg !== undefined)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return messages[0];
  }

  /**
   * Search messages by content
   */
  searchMessages(query: string, sessionId?: string, panelId?: string): Message[] {
    const lowerQuery = query.toLowerCase();
    let messages = Array.from(this.messages.values());

    if (sessionId) {
      messages = messages.filter(msg => msg.sessionId === sessionId);
    }

    if (panelId) {
      messages = messages.filter(msg => msg.panelId === panelId);
    }

    return messages
      .filter(msg => msg.content.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Get message count for session
   */
  getSessionMessageCount(sessionId: string): number {
    return (this.sessionMessages.get(sessionId) || []).length;
  }

  /**
   * Get message count for panel
   */
  getPanelMessageCount(panelId: string): number {
    return (this.panelMessages.get(panelId) || []).length;
  }

  /**
   * Clear all data (for testing)
   */
  clear(): void {
    this.messages.clear();
    this.sessionMessages.clear();
    this.panelMessages.clear();
  }
}
