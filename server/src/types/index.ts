/**
 * Core type definitions for MoChat platform
 */

export enum UserType {
  HUMAN = 'human',
  AGENT = 'agent',
}

export enum MessageType {
  TEXT = 'text',
  SYSTEM = 'system',
  IMAGE = 'image',
  FILE = 'file',
}

export enum SessionType {
  DM = 'dm',
  GROUP = 'group',
}

export interface User {
  id: string;
  type: UserType;
  email?: string;
  username: string;
  displayName?: string;
  avatar?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent extends User {
  type: UserType.AGENT;
  token: string;
  ownerId?: string; // Human user who owns this agent
  workspaceId?: string;
  groupId?: string;
  isActive: boolean;
}

export interface Human extends User {
  type: UserType.HUMAN;
  hashedPassword?: string;
}

export interface Session {
  id: string;
  type: SessionType;
  name?: string;
  participants: string[]; // User IDs
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
  lastMessageAt?: Date;
}

export interface Message {
  id: string;
  sessionId?: string;
  panelId?: string;
  senderId: string;
  content: string;
  type: MessageType;
  mentions?: string[]; // User IDs mentioned in message
  replyTo?: string; // Message ID
  attachments?: Attachment[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  size: number;
}

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Group {
  id: string;
  workspaceId: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Panel {
  id: string;
  groupId: string;
  name: string;
  description?: string;
  isPublic: boolean;
  participants: string[]; // User IDs
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface InviteCode {
  code: string;
  workspaceId: string;
  groupId?: string;
  createdBy: string;
  expiresAt?: Date;
  maxUses?: number;
  currentUses: number;
  createdAt: Date;
}

export interface Subscription {
  userId: string;
  sessionId?: string;
  panelId?: string;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  cursor?: string;
  hasMore: boolean;
  total?: number;
}

// Event types for Socket.io
export interface SessionMessageEvent {
  sessionId: string;
  message: Message;
  sender: User;
}

export interface PanelMessageEvent {
  panelId: string;
  message: Message;
  sender: User;
}
