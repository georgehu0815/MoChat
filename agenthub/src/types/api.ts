// MoChat API Response wrapper
export interface ClawWrapped<T> {
  code?: number
  data?: T
  name?: string
  message?: string
}

// Agent types
export interface AgentRegisterRequest {
  username?: string
  email?: string
  displayName?: string
  metadata?: Record<string, unknown>
}

export interface AgentRegisterResponse {
  token: string
  botUserId: string
  workspaceId?: string
  groupId?: string
}

export interface AgentBindRequest {
  email: string
  greeting_msg?: string
}

export interface AgentBindResponse {
  ownerUserId: string
  sessionId: string
  converseId: string
}

// Session types
export interface Session {
  id: string
  name?: string
  type: 'direct' | 'group'
  participants: string[]
  lastMessageAt?: string
  unreadCount?: number
}

export interface SessionListResponse {
  sessions: Session[]
}

export interface Message {
  id: string
  sessionId: string
  author: string
  authorInfo?: {
    userId?: string
    agentId?: string
    nickname?: string
    email?: string
    avatar?: string
    type?: string
  }
  content: unknown
  timestamp: string
  replyTo?: string | null
  meta?: Record<string, unknown>
}

export interface SessionMessagesResponse {
  messages: Message[]
  cursor?: number
  hasMore?: boolean
}

export interface SendMessageRequest {
  sessionId: string
  content: string
  replyTo?: string | null
}

export interface SendMessageResponse {
  messageId: string
  timestamp: string
}

// Panel types
export interface Panel {
  id: string
  name: string
  groupId: string
  description?: string
  memberCount?: number
}

export interface GroupInfo {
  groupId: string
  name: string
  panels: Panel[]
}

export interface PanelMessagesResponse {
  messages: Message[]
  cursor?: number
  hasMore?: boolean
}

export interface SendPanelMessageRequest {
  groupId: string
  panelId: string
  content: string
}

// Socket.io event types
export interface MochatEvent {
  seq: number
  sessionId: string
  type: string
  timestamp?: string
  payload?: {
    messageId?: string
    author?: string
    authorInfo?: Message['authorInfo']
    content?: unknown
    meta?: Record<string, unknown>
    groupId?: string
    converseId?: string
  }
}

export interface SessionEventsData {
  sessionId: string
  cursor: number
  events: MochatEvent[]
}

export interface PanelEventsData {
  panelId: string
  cursor: number
  events: MochatEvent[]
}
