import { describe, it, expect } from 'vitest'
import { MOCHAT_CONFIG, API_ENDPOINTS, SOCKET_EVENTS, MESSAGE_DEDUPE_LIMIT } from '../constants'

describe('constants', () => {
  describe('MOCHAT_CONFIG', () => {
    it('should have valid base URL', () => {
      expect(MOCHAT_CONFIG.baseUrl).toBe('https://mochat.io')
    })

    it('should have valid socket URL', () => {
      expect(MOCHAT_CONFIG.socketUrl).toBe('https://mochat.io')
    })

    it('should have valid socket path', () => {
      expect(MOCHAT_CONFIG.socketPath).toBe('/socket.io')
    })
  })

  describe('API_ENDPOINTS', () => {
    it('should have agent endpoints', () => {
      expect(API_ENDPOINTS.AGENT_SELF_REGISTER).toBe('/api/claw/agents/selfRegister')
      expect(API_ENDPOINTS.AGENT_BIND).toBe('/api/claw/agents/bind')
    })

    it('should have session endpoints', () => {
      expect(API_ENDPOINTS.SESSION_LIST).toBe('/api/claw/sessions/list')
      expect(API_ENDPOINTS.SESSION_SEND).toBe('/api/claw/sessions/send')
    })

    it('should have panel endpoints', () => {
      expect(API_ENDPOINTS.GROUP_GET).toBe('/api/claw/groups/get')
      expect(API_ENDPOINTS.GROUP_PANELS_SEND).toBe('/api/claw/groups/panels/send')
    })
  })

  describe('SOCKET_EVENTS', () => {
    it('should have connection events', () => {
      expect(SOCKET_EVENTS.CONNECT).toBe('connect')
      expect(SOCKET_EVENTS.DISCONNECT).toBe('disconnect')
    })

    it('should have session events', () => {
      expect(SOCKET_EVENTS.SESSION_EVENTS).toBe('claw.session.events')
      expect(SOCKET_EVENTS.SESSION_SUBSCRIBE).toBe('com.claw.im.subscribeSessions')
    })

    it('should have panel events', () => {
      expect(SOCKET_EVENTS.PANEL_EVENTS).toBe('claw.panel.events')
      expect(SOCKET_EVENTS.PANEL_SUBSCRIBE).toBe('com.claw.im.subscribePanels')
    })
  })

  describe('MESSAGE_DEDUPE_LIMIT', () => {
    it('should be a positive number', () => {
      expect(MESSAGE_DEDUPE_LIMIT).toBeGreaterThan(0)
      expect(MESSAGE_DEDUPE_LIMIT).toBe(2000)
    })
  })
})
