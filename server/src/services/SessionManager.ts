/**
 * Session Manager Service
 * Handles private DMs and group conversations
 */

import { IUserStore } from '../data/IUserStore';
import { MessageStore } from '../data/MessageStore';
import { MetadataStore } from '../data/MetadataStore';
import { Session, Message, MessageType, SessionType, PaginatedResponse } from '../types';
import { generateId } from '../utils/id';
import { extractMentions } from '../utils/mention';
import { AppError } from '../middleware/errorHandler';

export class SessionManager {
  constructor(
    private userStore: IUserStore,
    private messageStore: MessageStore,
    private metadataStore: MetadataStore
  ) {}

  /**
   * Create a new session
   */
  async createSession(params: {
    type: SessionType;
    participants: string[];
    createdBy: string;
    name?: string;
    metadata?: Record<string, any>;
  }): Promise<Session> {
    // Validate participants exist
    const users = this.userStore.getUsersByIds(params.participants);
    if (users.length !== params.participants.length) {
      throw new AppError(400, 'One or more participants not found');
    }

    // For DM, ensure only 2 participants
    if (params.type === SessionType.DM && params.participants.length !== 2) {
      throw new AppError(400, 'DM sessions must have exactly 2 participants');
    }

    const session = this.metadataStore.createSession({
      id: generateId(),
      type: params.type,
      name: params.name,
      participants: params.participants,
      createdBy: params.createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: params.metadata,
    });

    return session;
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string, userId: string): Promise<Session> {
    const session = this.metadataStore.getSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Verify user is participant
    if (!session.participants.includes(userId)) {
      throw new AppError(403, 'You are not a participant in this session');
    }

    return session;
  }

  /**
   * Get detailed session info
   */
  async getSessionDetail(sessionId: string, userId: string): Promise<{
    session: Session;
    participants: any[];
    messageCount: number;
    lastMessage?: Message;
  }> {
    const session = await this.getSession(sessionId, userId);
    const participants = this.userStore.getUsersByIds(session.participants);
    const messageCount = this.messageStore.getSessionMessageCount(sessionId);
    const lastMessage = this.messageStore.getLatestSessionMessage(sessionId);

    return {
      session,
      participants: participants.map(p => ({
        id: p.id,
        username: p.username,
        displayName: p.displayName,
        avatar: p.avatar,
        type: p.type,
      })),
      messageCount,
      lastMessage,
    };
  }

  /**
   * List all sessions for a user
   */
  async listSessions(userId: string): Promise<Session[]> {
    return this.metadataStore.getSessionsByUser(userId);
  }

  /**
   * Send a message in a session
   */
  async sendMessage(params: {
    sessionId: string;
    senderId: string;
    content: string;
    type?: MessageType;
    replyTo?: string;
    metadata?: Record<string, any>;
  }): Promise<Message> {
    const session = this.metadataStore.getSessionById(params.sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Verify sender is participant
    if (!session.participants.includes(params.senderId)) {
      throw new AppError(403, 'You are not a participant in this session');
    }

    // Extract mentions
    const mentions = extractMentions(params.content);

    const message: Message = {
      id: generateId(),
      sessionId: params.sessionId,
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

    // Update session's lastMessageAt
    this.metadataStore.updateSession(params.sessionId, {
      lastMessageAt: new Date(),
    });

    return message;
  }

  /**
   * Get messages in a session
   */
  async getMessages(
    sessionId: string,
    userId: string,
    options: {
      limit?: number;
      cursor?: string;
      before?: Date;
      after?: Date;
    } = {}
  ): Promise<PaginatedResponse<Message>> {
    const session = this.metadataStore.getSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Verify user is participant
    if (!session.participants.includes(userId)) {
      throw new AppError(403, 'You are not a participant in this session');
    }

    return this.messageStore.getSessionMessages(sessionId, options);
  }

  /**
   * Add participants to a group session
   */
  async addParticipants(
    sessionId: string,
    userId: string,
    participantIds: string[]
  ): Promise<Session> {
    const session = this.metadataStore.getSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    if (session.type === SessionType.DM) {
      throw new AppError(400, 'Cannot add participants to DM sessions');
    }

    // Verify requester is participant
    if (!session.participants.includes(userId)) {
      throw new AppError(403, 'You are not a participant in this session');
    }

    // Validate new participants exist
    const users = this.userStore.getUsersByIds(participantIds);
    if (users.length !== participantIds.length) {
      throw new AppError(400, 'One or more participants not found');
    }

    const updatedParticipants = [
      ...new Set([...session.participants, ...participantIds]),
    ];

    const updated = this.metadataStore.updateSession(sessionId, {
      participants: updatedParticipants,
    });

    if (!updated) {
      throw new AppError(500, 'Failed to add participants');
    }

    return updated;
  }

  /**
   * Remove participants from a group session
   */
  async removeParticipants(
    sessionId: string,
    userId: string,
    participantIds: string[]
  ): Promise<Session> {
    const session = this.metadataStore.getSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    if (session.type === SessionType.DM) {
      throw new AppError(400, 'Cannot remove participants from DM sessions');
    }

    // Verify requester is participant
    if (!session.participants.includes(userId)) {
      throw new AppError(403, 'You are not a participant in this session');
    }

    const updatedParticipants = session.participants.filter(
      id => !participantIds.includes(id)
    );

    if (updatedParticipants.length === 0) {
      throw new AppError(400, 'Cannot remove all participants');
    }

    const updated = this.metadataStore.updateSession(sessionId, {
      participants: updatedParticipants,
    });

    if (!updated) {
      throw new AppError(500, 'Failed to remove participants');
    }

    return updated;
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string, userId: string): Promise<void> {
    const session = this.metadataStore.getSessionById(sessionId);
    if (!session) {
      throw new AppError(404, 'Session not found');
    }

    // Verify requester is participant or creator
    if (!session.participants.includes(userId) && session.createdBy !== userId) {
      throw new AppError(403, 'You do not have permission to close this session');
    }

    this.metadataStore.deleteSession(sessionId);
  }
}
