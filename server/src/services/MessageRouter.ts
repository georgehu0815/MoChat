/**
 * Message Router Service
 * Handles intelligent message routing with mention detection and filtering
 */

import { IUserStore } from '../data/IUserStore';
import { MetadataStore } from '../data/MetadataStore';
import { Message, User } from '../types';
import { isMentioned, isMentionAll } from '../utils/mention';

export interface RoutingResult {
  shouldNotify: boolean;
  recipients: string[];
  reason: string;
}

export class MessageRouter {
  constructor(
    private userStore: IUserStore,
    private metadataStore: MetadataStore
  ) {}

  /**
   * Route a session message and determine recipients
   */
  routeSessionMessage(message: Message, sessionId: string): RoutingResult {
    const session = this.metadataStore.getSessionById(sessionId);
    if (!session) {
      return {
        shouldNotify: false,
        recipients: [],
        reason: 'Session not found',
      };
    }

    // Get all participants except sender
    const recipients = session.participants.filter(id => id !== message.senderId);

    // Get subscribers
    const subscribers = this.metadataStore.getSessionSubscribers(sessionId);

    // Combine participants and subscribers
    const allRecipients = [...new Set([...recipients, ...subscribers])];

    return {
      shouldNotify: true,
      recipients: allRecipients,
      reason: 'Session message',
    };
  }

  /**
   * Route a panel message and determine recipients with filtering
   */
  routePanelMessage(message: Message, panelId: string): RoutingResult {
    const panel = this.metadataStore.getPanelById(panelId);
    if (!panel) {
      return {
        shouldNotify: false,
        recipients: [],
        reason: 'Panel not found',
      };
    }

    // Get subscribers
    const subscribers = this.metadataStore.getPanelSubscribers(panelId);

    // Filter recipients based on mention logic
    const recipients: string[] = [];
    const isMentionAllMsg = isMentionAll(message.content);

    for (const userId of subscribers) {
      // Skip sender
      if (userId === message.senderId) continue;

      // Check if user is directly mentioned
      if (message.mentions?.includes(userId)) {
        recipients.push(userId);
        continue;
      }

      // Check if @all/@everyone is used
      if (isMentionAllMsg) {
        recipients.push(userId);
        continue;
      }

      // For agents, apply reply delay logic in client
      // Here we send to all subscribers, clients can filter
      recipients.push(userId);
    }

    return {
      shouldNotify: recipients.length > 0,
      recipients,
      reason: isMentionAllMsg
        ? 'Mention all'
        : message.mentions && message.mentions.length > 0
        ? 'Direct mention'
        : 'Panel message',
    };
  }

  /**
   * Check if agent should be notified immediately (mentioned or DM)
   */
  shouldNotifyImmediately(
    message: Message,
    agentId: string,
    isSessionMessage: boolean
  ): boolean {
    // Always notify immediately for session (DM/group) messages
    if (isSessionMessage) {
      return true;
    }

    // For panel messages, check mentions
    if (message.mentions?.includes(agentId)) {
      return true;
    }

    if (isMentionAll(message.content)) {
      return true;
    }

    return false;
  }

  /**
   * Filter users who should receive notification based on subscription
   */
  filterRecipientsBySubscription(
    userIds: string[],
    sessionId?: string,
    panelId?: string
  ): string[] {
    return userIds.filter(userId => {
      const subscriptions = this.metadataStore.getSubscriptions(userId);

      // Check for wildcard subscriptions
      const hasWildcard = subscriptions.some(
        sub =>
          (sessionId && sub.sessionId === '*') || (panelId && sub.panelId === '*')
      );

      if (hasWildcard) return true;

      // Check for specific subscriptions
      return subscriptions.some(
        sub =>
          (sessionId && sub.sessionId === sessionId) ||
          (panelId && sub.panelId === panelId)
      );
    });
  }

  /**
   * Get user details for routing
   */
  getUsersDetails(userIds: string[]): User[] {
    return this.userStore.getUsersByIds(userIds);
  }
}
