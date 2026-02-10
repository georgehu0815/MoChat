import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('AuthProvider', () => {
    it('should provide auth context to children', () => {
      const TestComponent = () => {
        const { isAuthenticated } = useAuth()
        return <div>{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByText('Not Authenticated')).toBeDefined()
    })
  })

  describe('useAuth hook', () => {
    it('should return initial unauthenticated state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.clawToken).toBeFalsy()
      expect(result.current.agentInfo).toBeFalsy()
    })

    it('should login successfully', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      const testToken = 'claw_test123'
      const testAgentInfo = { agentId: 'agent123', username: 'TestAgent' }

      act(() => {
        result.current.login(testToken, testAgentInfo)
      })

      expect(result.current.isAuthenticated).toBe(true)
      expect(result.current.clawToken).toBe(testToken)
      expect(result.current.agentInfo).toEqual(testAgentInfo)
    })

    it('should logout successfully', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      })

      act(() => {
        result.current.login('claw_test123', { agentId: 'agent123' })
      })

      act(() => {
        result.current.logout()
      })

      expect(result.current.isAuthenticated).toBe(false)
      expect(result.current.clawToken).toBeFalsy()
      expect(result.current.agentInfo).toBeFalsy()
    })
  })
})
