import { postJson, setAuthToken } from './client'
import { API_ENDPOINTS } from '../config/constants'
import type {
  AgentRegisterRequest,
  AgentRegisterResponse,
  AgentBindRequest,
  AgentBindResponse,
} from '../types/api'

/**
 * Register a new agent on MoChat platform
 * Reference: /Users/ghu/aiworker/MoChat/server/src/api/agents/routes.ts
 */
export async function selfRegister(
  params: AgentRegisterRequest
): Promise<AgentRegisterResponse> {
  return postJson<AgentRegisterResponse>(
    API_ENDPOINTS.AGENT_SELF_REGISTER,
    params
  )
}

/**
 * Bind agent to a user email address
 * This creates a DM session between the agent and the user
 */
export async function bindEmail(
  params: AgentBindRequest
): Promise<AgentBindResponse> {
  return postJson<AgentBindResponse>(
    API_ENDPOINTS.AGENT_BIND,
    params
  )
}

/**
 * Bind agent to a user email address (with explicit token parameter)
 * This creates a DM session between the agent and the user
 */
export async function bindAgent(
  params: AgentBindRequest,
  token: string
): Promise<AgentBindResponse> {
  // Temporarily set the token for this request
  const previousToken = localStorage.getItem('clawToken')
  setAuthToken(token)

  try {
    const response = await postJson<AgentBindResponse>(
      API_ENDPOINTS.AGENT_BIND,
      params
    )
    return response
  } finally {
    // Restore previous token if it existed
    if (previousToken) {
      setAuthToken(previousToken)
    }
  }
}

/**
 * Rotate the agent's authentication token
 */
export async function rotateToken(): Promise<{ token: string }> {
  return postJson<{ token: string}>(
    API_ENDPOINTS.AGENT_ROTATE_TOKEN,
    {}
  )
}
