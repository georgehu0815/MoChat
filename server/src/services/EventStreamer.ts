/**
 * Event Streamer Service
 * Handles real-time event distribution via Socket.io
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { IUserStore } from '../data/IUserStore';
import { MetadataStore } from '../data/MetadataStore';
import { Message, User, SessionMessageEvent, PanelMessageEvent } from '../types';
import { MessageRouter } from './MessageRouter';

interface SocketData {
  userId: string;
  token: string;
}

export class EventStreamer {
  private io: SocketIOServer;
  private socketUserMap: Map<string, string> = new Map(); // socketId -> userId
  private userSocketsMap: Map<string, Set<string>> = new Map(); // userId -> socketIds

  constructor(
    httpServer: HttpServer,
    private userStore: IUserStore,
    private metadataStore: MetadataStore,
    private _messageRouter: MessageRouter,
    options: {
      path?: string;
      cors?: any;
    } = {}
  ) {
    this.io = new SocketIOServer(httpServer, {
      path: options.path || '/socket.io',
      cors: options.cors || {
        origin: '*',
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
    });

    this.setupAuthentication();
    this.setupEventHandlers();
  }

  /**
   * Setup Socket.io authentication
   */
  private setupAuthentication(): void {
    this.io.use((socket, next) => {
      // BYPASS: Skip authentication if DISABLE_AUTH is enabled
      if (process.env.DISABLE_AUTH === 'true') {
        console.log('⚠️  Socket.io authentication DISABLED - bypassing auth check');
        (socket.data as SocketData).userId = 'test-agent-id';
        (socket.data as SocketData).token = 'test-token';
        next();
        return;
      }

      const token =
        socket.handshake.auth.token ||
        socket.handshake.query.token ||
        socket.handshake.headers['x-claw-token'];

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const agent = this.userStore.getAgentByToken(token as string);
      if (!agent) {
        return next(new Error('Authentication error: Invalid token'));
      }

      if (!agent.isActive) {
        return next(new Error('Authentication error: Agent is not active'));
      }

      (socket.data as SocketData).userId = agent.id;
      (socket.data as SocketData).token = token as string;

      next();
    });
  }

  /**
   * Setup Socket.io event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const socketData = socket.data as SocketData;
      const userId = socketData.userId;

      console.log(`User connected: ${userId} (socket: ${socket.id})`);

      // Track socket
      this.socketUserMap.set(socket.id, userId);
      if (!this.userSocketsMap.has(userId)) {
        this.userSocketsMap.set(userId, new Set());
      }
      this.userSocketsMap.get(userId)!.add(socket.id);

      // Handle session subscription
      socket.on('session:subscribe', (data: { sessionId: string }) => {
        this.handleSessionSubscribe(socket, userId, data.sessionId);
      });

      // Handle session unsubscribe
      socket.on('session:unsubscribe', (data: { sessionId: string }) => {
        this.handleSessionUnsubscribe(socket, userId, data.sessionId);
      });

      // Handle panel subscription
      socket.on('panel:subscribe', (data: { panelId: string }) => {
        this.handlePanelSubscribe(socket, userId, data.panelId);
      });

      // Handle panel unsubscribe
      socket.on('panel:unsubscribe', (data: { panelId: string }) => {
        this.handlePanelUnsubscribe(socket, userId, data.panelId);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId} (socket: ${socket.id})`);
        this.socketUserMap.delete(socket.id);
        this.userSocketsMap.get(userId)?.delete(socket.id);
        if (this.userSocketsMap.get(userId)?.size === 0) {
          this.userSocketsMap.delete(userId);
        }
      });
    });
  }

  /**
   * Handle session subscription
   */
  private handleSessionSubscribe(
    socket: Socket,
    userId: string,
    sessionId: string
  ): void {
    // Support wildcard subscription
    if (sessionId === '*') {
      // Subscribe to all user's sessions
      const sessions = this.metadataStore.getSessionsByUser(userId);
      sessions.forEach(session => {
        socket.join(`session:${session.id}`);
        this.metadataStore.addSubscription({
          userId,
          sessionId: session.id,
          createdAt: new Date(),
        });
      });
      console.log(`User ${userId} subscribed to all sessions`);
    } else {
      // Subscribe to specific session
      const session = this.metadataStore.getSessionById(sessionId);
      if (session && session.participants.includes(userId)) {
        socket.join(`session:${sessionId}`);
        this.metadataStore.addSubscription({
          userId,
          sessionId,
          createdAt: new Date(),
        });
        console.log(`User ${userId} subscribed to session ${sessionId}`);
      }
    }
  }

  /**
   * Handle session unsubscribe
   */
  private handleSessionUnsubscribe(
    socket: Socket,
    userId: string,
    sessionId: string
  ): void {
    socket.leave(`session:${sessionId}`);
    this.metadataStore.removeSubscription(userId, sessionId, undefined);
    console.log(`User ${userId} unsubscribed from session ${sessionId}`);
  }

  /**
   * Handle panel subscription
   */
  private handlePanelSubscribe(
    socket: Socket,
    userId: string,
    panelId: string
  ): void {
    // Support wildcard subscription
    if (panelId === '*') {
      // Subscribe to all panels in user's workspace
      const agent = this.userStore.getUserById(userId);
      if (agent && agent.type === 'agent') {
        const groups = this.metadataStore.getGroupsByWorkspace(
          (agent as any).workspaceId
        );
        groups.forEach(group => {
          const panels = this.metadataStore.getPanelsByGroup(group.id);
          panels.forEach(panel => {
            socket.join(`panel:${panel.id}`);
            this.metadataStore.addSubscription({
              userId,
              panelId: panel.id,
              createdAt: new Date(),
            });
          });
        });
      }
      console.log(`User ${userId} subscribed to all panels`);
    } else {
      // Subscribe to specific panel
      const panel = this.metadataStore.getPanelById(panelId);
      if (panel && (panel.isPublic || panel.participants.includes(userId))) {
        socket.join(`panel:${panelId}`);
        this.metadataStore.addSubscription({
          userId,
          panelId,
          createdAt: new Date(),
        });
        console.log(`User ${userId} subscribed to panel ${panelId}`);
      }
    }
  }

  /**
   * Handle panel unsubscribe
   */
  private handlePanelUnsubscribe(
    socket: Socket,
    userId: string,
    panelId: string
  ): void {
    socket.leave(`panel:${panelId}`);
    this.metadataStore.removeSubscription(userId, undefined, panelId);
    console.log(`User ${userId} unsubscribed from panel ${panelId}`);
  }

  /**
   * Broadcast session message
   */
  async broadcastSessionMessage(
    sessionId: string,
    message: Message,
    sender: User
  ): Promise<void> {
    const event: SessionMessageEvent = {
      sessionId,
      message,
      sender,
    };

    // Emit to all subscribers in the session room
    this.io.to(`session:${sessionId}`).emit('notify:session', event);

    console.log(
      `Broadcasted session message ${message.id} to session ${sessionId}`
    );
  }

  /**
   * Broadcast panel message
   */
  async broadcastPanelMessage(
    panelId: string,
    message: Message,
    sender: User
  ): Promise<void> {
    const event: PanelMessageEvent = {
      panelId,
      message,
      sender,
    };

    // Emit to all subscribers in the panel room
    this.io.to(`panel:${panelId}`).emit('notify:panel', event);

    console.log(`Broadcasted panel message ${message.id} to panel ${panelId}`);
  }

  /**
   * Send direct event to specific user
   */
  async sendToUser(userId: string, event: string, data: any): Promise<void> {
    const socketIds = this.userSocketsMap.get(userId);
    if (socketIds) {
      socketIds.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userSocketsMap.size;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userSocketsMap.has(userId);
  }

  /**
   * Get Socket.io server instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }
}
