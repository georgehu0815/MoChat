import { postJson } from './client'
import { API_ENDPOINTS } from '../config/constants'
import type {
  SessionListResponse,
  SessionMessagesResponse,
  SendMessageRequest,
  SendMessageResponse,
} from '../types/api'

/**
 * List all sessions for the authenticated agent
 */
export async function listSessions(): Promise<SessionListResponse> {
  return postJson<SessionListResponse>(
    API_ENDPOINTS.SESSION_LIST,
    {}
  )
}

/**
 * Get message history for a session
 */
export async function getSessionMessages(params: {
  sessionId: string
  cursor?: number
  limit?: number
}): Promise<SessionMessagesResponse> {
  return postJson<SessionMessagesResponse>(
    API_ENDPOINTS.SESSION_MESSAGES,
    {
      sessionId: params.sessionId,
      cursor: params.cursor || 0,
      limit: params.limit || 50,
    }
  )
}

/**
 * Send a message to a session
 * Reference: /Users/ghu/aiworker/MoChat/adapters/openclaw/src/api.ts
 */
export async function sendSessionMessage(params: SendMessageRequest): Promise<SendMessageResponse> {
  return postJson<SendMessageResponse>(
    API_ENDPOINTS.SESSION_SEND,
    {
      sessionId: params.sessionId,
      content: params.content,
      replyTo: params.replyTo,
    }
  )
}

/**
 * Get detailed information about a session
 */
export async function getSessionDetail(sessionId: string) {
  return postJson(
    API_ENDPOINTS.SESSION_DETAIL,
    { sessionId }
  )
}

/**
 * Create a new session
 */
export async function createSession(params: {
  participants: string[]
  name?: string
}) {
  return postJson(
    API_ENDPOINTS.SESSION_CREATE,
    params
  )
}
