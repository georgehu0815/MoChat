import { io, Socket } from 'socket.io-client'
import msgpackParser from 'socket.io-msgpack-parser'
import { MOCHAT_CONFIG, SOCKET_EVENTS, SOCKET_CONFIG } from '../config/constants'
import type { SessionEventsData, PanelEventsData } from '../types/api'

export type SocketConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface SocketClientOptions {
  token: string
  onConnect?: () => void
  onDisconnect?: (reason: string) => void
  onError?: (error: Error) => void
  onSessionEvents?: (data: SessionEventsData) => void
  onPanelEvents?: (data: PanelEventsData) => void
}

/**
 * Socket.io client wrapper for MoChat real-time communication
 * Reference: /Users/ghu/aiworker/MoChat/adapters/openclaw/src/socket.ts
 */
export class SocketClient {
  private socket: Socket | null = null
  private options: SocketClientOptions
  private status: SocketConnectionStatus = 'disconnected'
  private reconnectAttempts = 0

  constructor(options: SocketClientOptions) {
    this.options = options
  }

  /**
   * Initialize and connect to Socket.io server
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('Socket already connected')
      return
    }

    this.status = 'connecting'

    // Create socket with msgpack compression
    this.socket = io(MOCHAT_CONFIG.socketUrl, {
      path: MOCHAT_CONFIG.socketPath,
      auth: {
        token: this.options.token,
      },
      parser: msgpackParser,
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: SOCKET_CONFIG.reconnectionDelay,
      reconnectionDelayMax: SOCKET_CONFIG.reconnectionDelayMax,
      reconnectionAttempts: SOCKET_CONFIG.reconnectionAttempts,
      timeout: SOCKET_CONFIG.timeout,
      autoConnect: false,
    })

    this.setupEventListeners()
    this.socket.connect()
  }

  /**
   * Set up socket event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return

    // Connection events
    this.socket.on(SOCKET_EVENTS.CONNECT, () => {
      console.log('Socket connected')
      this.status = 'connected'
      this.reconnectAttempts = 0
      this.options.onConnect?.()
    })

    this.socket.on(SOCKET_EVENTS.DISCONNECT, (reason: string) => {
      console.log('Socket disconnected:', reason)
      this.status = 'disconnected'
      this.options.onDisconnect?.(reason)
    })

    this.socket.on(SOCKET_EVENTS.CONNECT_ERROR, (error: Error) => {
      console.error('Socket connection error:', error)
      this.status = 'error'
      this.reconnectAttempts++
      this.options.onError?.(error)
    })

    this.socket.on(SOCKET_EVENTS.RECONNECT, (attemptNumber: number) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts')
      this.status = 'connected'
      this.reconnectAttempts = 0
    })

    // Message events
    this.socket.on(SOCKET_EVENTS.SESSION_EVENTS, (data: SessionEventsData) => {
      console.log('Received session events:', data)
      this.options.onSessionEvents?.(data)
    })

    this.socket.on(SOCKET_EVENTS.PANEL_EVENTS, (data: PanelEventsData) => {
      console.log('Received panel events:', data)
      this.options.onPanelEvents?.(data)
    })
  }

  /**
   * Subscribe to session events
   * Reference: /Users/ghu/aiworker/MoChat/adapters/openclaw/src/socket.ts (lines 75-148)
   */
  subscribeToSessions(params: {
    sessionIds: string[]
    cursors?: Record<string, number>
    limit?: number
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit(
        SOCKET_EVENTS.SESSION_SUBSCRIBE,
        {
          sessionIds: params.sessionIds,
          cursors: params.cursors || {},
          limit: params.limit || 100,
        },
        (ack: { result?: boolean; error?: string }) => {
          if (ack.result) {
            console.log('Subscribed to sessions:', params.sessionIds)
            resolve()
          } else {
            console.error('Failed to subscribe to sessions:', ack.error)
            reject(new Error(ack.error || 'Subscription failed'))
          }
        }
      )
    })
  }

  /**
   * Unsubscribe from session events
   */
  unsubscribeFromSessions(sessionIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit(
        SOCKET_EVENTS.SESSION_UNSUBSCRIBE,
        { sessionIds },
        (ack: { result?: boolean; error?: string }) => {
          if (ack.result) {
            console.log('Unsubscribed from sessions:', sessionIds)
            resolve()
          } else {
            reject(new Error(ack.error || 'Unsubscription failed'))
          }
        }
      )
    })
  }

  /**
   * Subscribe to panel events
   */
  subscribeToPanels(params: {
    panelIds: string[]
    cursors?: Record<string, number>
    limit?: number
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit(
        SOCKET_EVENTS.PANEL_SUBSCRIBE,
        {
          panelIds: params.panelIds,
          cursors: params.cursors || {},
          limit: params.limit || 100,
        },
        (ack: { result?: boolean; error?: string }) => {
          if (ack.result) {
            console.log('Subscribed to panels:', params.panelIds)
            resolve()
          } else {
            reject(new Error(ack.error || 'Subscription failed'))
          }
        }
      )
    })
  }

  /**
   * Unsubscribe from panel events
   */
  unsubscribeFromPanels(panelIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'))
        return
      }

      this.socket.emit(
        SOCKET_EVENTS.PANEL_UNSUBSCRIBE,
        { panelIds },
        (ack: { result?: boolean; error?: string }) => {
          if (ack.result) {
            console.log('Unsubscribed from panels:', panelIds)
            resolve()
          } else {
            reject(new Error(ack.error || 'Unsubscription failed'))
          }
        }
      )
    })
  }

  /**
   * Disconnect from socket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.status = 'disconnected'
    }
  }

  /**
   * Get current connection status
   */
  getStatus(): SocketConnectionStatus {
    return this.status
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false
  }

  /**
   * Update authentication token
   */
  updateToken(token: string): void {
    this.options.token = token
    if (this.socket) {
      this.socket.auth = { token }
    }
  }
}

// Singleton instance
let socketClientInstance: SocketClient | null = null

/**
 * Get or create socket client instance
 */
export function getSocketClient(options?: SocketClientOptions): SocketClient | null {
  if (options) {
    if (socketClientInstance) {
      socketClientInstance.disconnect()
    }
    socketClientInstance = new SocketClient(options)
  }
  return socketClientInstance
}

/**
 * Destroy socket client instance
 */
export function destroySocketClient(): void {
  if (socketClientInstance) {
    socketClientInstance.disconnect()
    socketClientInstance = null
  }
}

export default SocketClient
