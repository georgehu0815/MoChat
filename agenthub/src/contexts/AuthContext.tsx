import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface AgentInfo {
  agentId: string
  username?: string
  email?: string
  workspaceId?: string
  groupId?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  clawToken: string | null
  agentInfo: AgentInfo | null
  login: (token: string, agentInfo: AgentInfo) => void
  logout: () => void
  updateAgentInfo: (info: Partial<AgentInfo>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [clawToken, setClawToken] = useState<string | null>(() => {
    return localStorage.getItem('clawToken')
  })

  const [agentInfo, setAgentInfo] = useState<AgentInfo | null>(() => {
    const saved = localStorage.getItem('agentInfo')
    return saved ? JSON.parse(saved) : null
  })

  const isAuthenticated = !!clawToken && !!agentInfo

  useEffect(() => {
    if (clawToken) {
      localStorage.setItem('clawToken', clawToken)
    } else {
      localStorage.removeItem('clawToken')
    }
  }, [clawToken])

  useEffect(() => {
    if (agentInfo) {
      localStorage.setItem('agentInfo', JSON.stringify(agentInfo))
    } else {
      localStorage.removeItem('agentInfo')
    }
  }, [agentInfo])

  const login = (token: string, info: AgentInfo) => {
    setClawToken(token)
    setAgentInfo(info)
  }

  const logout = () => {
    setClawToken(null)
    setAgentInfo(null)
    localStorage.clear()
  }

  const updateAgentInfo = (info: Partial<AgentInfo>) => {
    setAgentInfo(prev => prev ? { ...prev, ...info } : null)
  }

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      clawToken,
      agentInfo,
      login,
      logout,
      updateAgentInfo
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
