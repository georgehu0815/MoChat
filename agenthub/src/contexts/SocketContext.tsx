import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Socket } from 'socket.io-client'
import { SocketClient, getSocketClient, destroySocketClient, SocketConnectionStatus } from '../api/socket'
import type { SessionEventsData, PanelEventsData } from '../types/api'

interface SocketContextType {
  socket: Socket | null
  status: SocketConnectionStatus
  isConnected: boolean
  connect: (token: string) => Promise<void>
  disconnect: () => void
  subscribeToSessions: (sessionIds: string[], cursors?: Record<string, number>) => Promise<void>
  subscribeToPanels: (panelIds: string[], cursors?: Record<string, number>) => Promise<void>
  onSessionEvents: (handler: (data: SessionEventsData) => void) => void
  onPanelEvents: (handler: (data: PanelEventsData) => void) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<SocketClient | null>(null)
  const [status, setStatus] = useState<SocketConnectionStatus>('disconnected')
  const [sessionEventHandlers, setSessionEventHandlers] = useState<((data: SessionEventsData) => void)[]>([])
  const [panelEventHandlers, setPanelEventHandlers] = useState<((data: PanelEventsData) => void)[]>([])

  const connect = useCallback(async (token: string) => {
    if (client?.isConnected()) {
      console.log('Socket already connected')
      return
    }

    setStatus('connecting')

    const newClient = getSocketClient({
      token,
      onConnect: () => {
        setStatus('connected')
      },
      onDisconnect: (reason: string) => {
        console.log('Socket disconnected:', reason)
        setStatus('disconnected')
      },
      onError: (error: Error) => {
        console.error('Socket connection error:', error)
        setStatus('error')
      },
      onSessionEvents: (data: SessionEventsData) => {
        sessionEventHandlers.forEach((handler) => handler(data))
      },
      onPanelEvents: (data: PanelEventsData) => {
        panelEventHandlers.forEach((handler) => handler(data))
      },
    })

    if (newClient) {
      setClient(newClient)
      newClient.connect()

      // Wait for connection to establish
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'))
        }, 10000)

        const checkConnection = setInterval(() => {
          if (newClient.isConnected()) {
            clearInterval(checkConnection)
            clearTimeout(timeout)
            resolve()
          }
        }, 100)
      })
    }
  }, [client, sessionEventHandlers, panelEventHandlers])

  const disconnect = useCallback(() => {
    if (client) {
      client.disconnect()
      setClient(null)
      setStatus('disconnected')
    }
    destroySocketClient()
  }, [client])

  const subscribeToSessions = useCallback(
    async (sessionIds: string[], cursors?: Record<string, number>) => {
      if (!client) {
        throw new Error('Socket client not initialized')
      }
      await client.subscribeToSessions({ sessionIds, cursors })
    },
    [client]
  )

  const subscribeToPanels = useCallback(
    async (panelIds: string[], cursors?: Record<string, number>) => {
      if (!client) {
        throw new Error('Socket client not initialized')
      }
      await client.subscribeToPanels({ panelIds, cursors })
    },
    [client]
  )

  const onSessionEvents = useCallback((handler: (data: SessionEventsData) => void) => {
    setSessionEventHandlers((prev) => [...prev, handler])
  }, [])

  const onPanelEvents = useCallback((handler: (data: PanelEventsData) => void) => {
    setPanelEventHandlers((prev) => [...prev, handler])
  }, [])

  const value: SocketContextType = {
    socket: client ? (client as any).socket : null,
    status,
    isConnected: client?.isConnected() ?? false,
    connect,
    disconnect,
    subscribeToSessions,
    subscribeToPanels,
    onSessionEvents,
    onPanelEvents,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider')
  }
  return context
}
