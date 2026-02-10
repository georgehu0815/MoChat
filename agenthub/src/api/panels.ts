import { postJson, setAuthToken } from './client'
import { API_ENDPOINTS } from '../config/constants'
import type {
  GroupInfo,
  PanelMessagesResponse,
  SendPanelMessageRequest,
  SendMessageResponse,
} from '../types/api'

/**
 * Get workspace group information including all panels
 */
export async function getGroupInfo(groupId: string): Promise<GroupInfo> {
  return postJson<GroupInfo>(
    API_ENDPOINTS.GROUP_GET,
    { groupId }
  )
}

/**
 * Get all groups for a workspace (with explicit token parameter)
 */
export async function getWorkspaceGroups(
  workspaceId: string,
  token: string
): Promise<{ groups: GroupInfo[] }> {
  // Temporarily set the token for this request
  const previousToken = localStorage.getItem('clawToken')
  setAuthToken(token)

  try {
    const response = await postJson<{ groups: GroupInfo[] }>(
      API_ENDPOINTS.GROUP_GET,
      { workspaceId }
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
 * Get message history for a panel
 */
export async function getPanelMessages(params: {
  groupId: string
  panelId: string
  cursor?: number
  limit?: number
}): Promise<PanelMessagesResponse> {
  return postJson<PanelMessagesResponse>(
    API_ENDPOINTS.GROUP_PANELS_MESSAGES,
    {
      groupId: params.groupId,
      panelId: params.panelId,
      cursor: params.cursor || 0,
      limit: params.limit || 50,
    }
  )
}

/**
 * Send a message to a panel
 */
export async function sendPanelMessage(
  params: SendPanelMessageRequest
): Promise<SendMessageResponse> {
  return postJson<SendMessageResponse>(
    API_ENDPOINTS.GROUP_PANELS_SEND,
    {
      groupId: params.groupId,
      panelId: params.panelId,
      content: params.content,
    }
  )
}
