import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

global.localStorage = localStorageMock as any

// Mock environment variables
process.env.VITE_MOCHAT_BASE_URL = 'https://mochat.io'
process.env.VITE_MOCHAT_SOCKET_URL = 'https://mochat.io'
process.env.VITE_MOCHAT_SOCKET_PATH = '/socket.io'
