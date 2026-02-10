/**
 * Integration tests for MoChat API
 * These tests run against the actual backend server at localhost:3000
 *
 * To run: npm run test:integration
 */

import { describe, it, expect, beforeAll } from 'vitest'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:3000'
const TEST_USERNAME = `test-agent-${Date.now()}`
const TEST_EMAIL = `test-${Date.now()}@example.com`

let testToken: string
let testAgentId: string
let testWorkspaceId: string
let testGroupId: string
let testSessionId: string

describe('MoChat API Integration Tests', () => {
  // Test 1: Health Check
  describe('GET /health', () => {
    it('should return server health status', async () => {
      const response = await axios.get(`${API_BASE_URL}/health`)

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('status', 'ok')
      expect(response.data).toHaveProperty('timestamp')
      expect(response.data).toHaveProperty('connectedUsers')
    })
  })

  // Test 2: Agent Self-Registration
  describe('POST /api/claw/agents/selfRegister', () => {
    it('should successfully register a new agent', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/claw/agents/selfRegister`,
        {
          username: TEST_USERNAME,
          email: TEST_EMAIL,
          displayName: `Test Agent ${Date.now()}`,
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data.data).toHaveProperty('token')
      expect(response.data.data).toHaveProperty('botUserId')
      expect(response.data.data).toHaveProperty('workspaceId')
      expect(response.data.data).toHaveProperty('groupId')

      // Store for later tests
      testToken = response.data.data.token
      testAgentId = response.data.data.botUserId
      testWorkspaceId = response.data.data.workspaceId
      testGroupId = response.data.data.groupId

      // Verify token format
      expect(testToken).toMatch(/^claw_[a-zA-Z0-9]+$/)
    })

    it('should reject registration with invalid username', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/claw/agents/selfRegister`, {
          username: 'ab', // Too short (min 3)
        })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400)
      }
    })

    it('should reject registration with duplicate username', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/claw/agents/selfRegister`, {
          username: TEST_USERNAME, // Already registered
        })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400)
      }
    })
  })

  // Test 3: Agent Email Binding
  describe('POST /api/claw/agents/bind', () => {
    it('should successfully bind agent to user email', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/claw/agents/bind`,
        {
          email: TEST_EMAIL,
          greeting_msg: 'Hello! I am your test agent.',
        },
        {
          headers: {
            'X-Claw-Token': testToken,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data).toHaveProperty('success', true)
      expect(response.data.data).toHaveProperty('ownerUserId')
      expect(response.data.data).toHaveProperty('sessionId')
      expect(response.data.data).toHaveProperty('converseId')

      // Store session ID for later tests
      testSessionId = response.data.data.sessionId
    })

    it('should reject binding without authentication', async () => {
      try {
        await axios.post(`${API_BASE_URL}/api/claw/agents/bind`, {
          email: TEST_EMAIL,
        })
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
      }
    })

    it('should reject binding with invalid token', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/claw/agents/bind`,
          {
            email: TEST_EMAIL,
          },
          {
            headers: {
              'X-Claw-Token': 'claw_invalid_token_123',
            },
          }
        )
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
      }
    })
  })

  // Test 4: Get Agent Details
  describe('POST /api/claw/agents/get', () => {
    it('should return agent details', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/claw/agents/get`,
        {},
        {
          headers: {
            'X-Claw-Token': testToken,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toHaveProperty('id', testAgentId)
      expect(response.data.data).toHaveProperty('username', TEST_USERNAME)
      expect(response.data.data).toHaveProperty('workspaceId', testWorkspaceId)
      expect(response.data.data).toHaveProperty('isActive', true)
    })
  })

  // Test 5: List Sessions
  describe('POST /api/claw/sessions/list', () => {
    it('should return list of sessions', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/claw/sessions/list`,
        {},
        {
          headers: {
            'X-Claw-Token': testToken,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(Array.isArray(response.data.data)).toBe(true)

      // Should include the session created during binding
      const bindSession = response.data.data.find(
        (s: any) => s.id === testSessionId
      )
      expect(bindSession).toBeDefined()
    })
  })

  // Test 6: Get Session Messages
  describe('POST /api/claw/sessions/messages', () => {
    it('should return session messages', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/claw/sessions/messages`,
        {
          sessionId: testSessionId,
          limit: 50,
        },
        {
          headers: {
            'X-Claw-Token': testToken,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toHaveProperty('items')
      expect(Array.isArray(response.data.data.items)).toBe(true)
    })
  })

  // Test 7: Send Message to Session
  describe('POST /api/claw/sessions/send', () => {
    it('should successfully send a message', async () => {
      const testMessage = `Integration test message sent at ${new Date().toISOString()}`

      const response = await axios.post(
        `${API_BASE_URL}/api/claw/sessions/send`,
        {
          sessionId: testSessionId,
          content: testMessage,
        },
        {
          headers: {
            'X-Claw-Token': testToken,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toHaveProperty('id')
      expect(response.data.data).toHaveProperty('createdAt')
    })

    it('should reject sending to invalid session', async () => {
      try {
        await axios.post(
          `${API_BASE_URL}/api/claw/sessions/send`,
          {
            sessionId: 'invalid-session-id',
            content: 'Test message',
          },
          {
            headers: {
              'X-Claw-Token': testToken,
            },
          }
        )
        expect.fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBeGreaterThanOrEqual(400)
      }
    })
  })

  // Test 8: Get Workspace Groups
  describe('POST /api/claw/groups/get', () => {
    it('should return workspace group information', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/claw/groups/get`,
        {
          groupId: testWorkspaceId, // Use workspace ID
        },
        {
          headers: {
            'X-Claw-Token': testToken,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toHaveProperty('workspace')
      expect(response.data.data.workspace).toHaveProperty('id', testWorkspaceId)
      expect(response.data.data).toHaveProperty('groups')
      expect(Array.isArray(response.data.data.groups)).toBe(true)
    })
  })

  // Test 9: Token Rotation
  describe('POST /api/claw/agents/rotateToken', () => {
    it('should generate a new token', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/api/claw/agents/rotateToken`,
        {},
        {
          headers: {
            'X-Claw-Token': testToken,
          },
        }
      )

      expect(response.status).toBe(200)
      expect(response.data.success).toBe(true)
      expect(response.data.data).toHaveProperty('token')

      const newToken = response.data.data.token
      expect(newToken).toMatch(/^claw_[a-zA-Z0-9]+$/)
      expect(newToken).not.toBe(testToken)

      // Verify old token no longer works
      try {
        await axios.post(
          `${API_BASE_URL}/api/claw/agents/get`,
          {},
          {
            headers: {
              'X-Claw-Token': testToken,
            },
          }
        )
        expect.fail('Old token should be invalid')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
      }

      // Update token for any remaining tests
      testToken = newToken
    })
  })

  // Summary Test
  describe('Integration Summary', () => {
    it('should have completed all tests successfully', () => {
      expect(testToken).toBeDefined()
      expect(testAgentId).toBeDefined()
      expect(testWorkspaceId).toBeDefined()
      expect(testGroupId).toBeDefined()
      expect(testSessionId).toBeDefined()

      console.log('\n✅ Integration Test Summary:')
      console.log(`   Agent ID: ${testAgentId}`)
      console.log(`   Username: ${TEST_USERNAME}`)
      console.log(`   Workspace ID: ${testWorkspaceId}`)
      console.log(`   Group ID: ${testGroupId}`)
      console.log(`   Session ID: ${testSessionId}`)
      console.log(`   Token: ${testToken.substring(0, 20)}...`)
    })
  })
})
