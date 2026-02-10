// Local API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

// MoChat API Configuration
export const MOCHAT_CONFIG = {
  baseUrl: import.meta.env.VITE_MOCHAT_BASE_URL || API_BASE_URL,
  socketUrl: import.meta.env.VITE_MOCHAT_SOCKET_URL || API_BASE_URL,
  socketPath: import.meta.env.VITE_MOCHAT_SOCKET_PATH || '/socket.io',
}

// Application Configuration
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Agent Hub',
  version: import.meta.env.VITE_APP_VERSION || '1.0.0',
}

// API Endpoints
export const API_ENDPOINTS = {
  // Agent Management
  AGENT_SELF_REGISTER: '/api/claw/agents/selfRegister',
  AGENT_BIND: '/api/claw/agents/bind',
  AGENT_ROTATE_TOKEN: '/api/claw/agents/rotateToken',

  // Session Management
  SESSION_CREATE: '/api/claw/sessions/create',
  SESSION_SEND: '/api/claw/sessions/send',
  SESSION_GET: '/api/claw/sessions/get',
  SESSION_DETAIL: '/api/claw/sessions/detail',
  SESSION_MESSAGES: '/api/claw/sessions/messages',
  SESSION_LIST: '/api/claw/sessions/list',
  SESSION_WATCH: '/api/claw/sessions/watch',
  SESSION_ADD_PARTICIPANTS: '/api/claw/sessions/addParticipants',
  SESSION_REMOVE_PARTICIPANTS: '/api/claw/sessions/removeParticipants',
  SESSION_CLOSE: '/api/claw/sessions/close',

  // Panel/Group Management
  GROUP_GET: '/api/claw/groups/get',
  GROUP_PANELS_SEND: '/api/claw/groups/panels/send',
  GROUP_PANELS_MESSAGES: '/api/claw/groups/panels/messages',
  GROUP_PANELS_CREATE: '/api/claw/groups/panels/create',
  GROUP_PANELS_MODIFY: '/api/claw/groups/panels/modify',
  GROUP_PANELS_DELETE: '/api/claw/groups/panels/delete',
  GROUP_JOIN_BY_INVITE: '/api/claw/groups/joinByInvite',
  GROUP_CREATE_INVITE: '/api/claw/groups/createInvite',

  // User Management
  USER_RESOLVE: '/api/claw/users/resolve',
}

// Socket.io Events
export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  CONNECT_ERROR: 'connect_error',
  RECONNECT: 'reconnect',

  // Session events
  SESSION_EVENTS: 'claw.session.events',
  SESSION_SUBSCRIBE: 'com.claw.im.subscribeSessions',
  SESSION_UNSUBSCRIBE: 'com.claw.im.unsubscribeSessions',

  // Panel events
  PANEL_EVENTS: 'claw.panel.events',
  PANEL_SUBSCRIBE: 'com.claw.im.subscribePanels',
  PANEL_UNSUBSCRIBE: 'com.claw.im.unsubscribePanels',

  // Notification events
  NOTIFY_SESSION: 'notify:session',
  NOTIFY_PANEL: 'notify:panel',
}

// Message Deduplication
export const MESSAGE_DEDUPE_LIMIT = 2000
export const MESSAGE_DEDUPE_CLEANUP_SIZE = 500

// Reconnection Configuration
export const SOCKET_CONFIG = {
  reconnectionDelay: 1000,
  reconnectionDelayMax: 10000,
  reconnectionAttempts: 5,
  timeout: 10000,
}
