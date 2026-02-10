import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getItem, setItem, removeItem, clear, STORAGE_KEYS } from '../storage'

describe('storage utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('getItem', () => {
    it('should return parsed value if item exists', () => {
      const testData = { name: 'test', value: 123 }
      localStorage.getItem = vi.fn().mockReturnValue(JSON.stringify(testData))

      const result = getItem('testKey', null)
      expect(result).toEqual(testData)
    })

    it('should return default value if item does not exist', () => {
      localStorage.getItem = vi.fn().mockReturnValue(null)

      const result = getItem('testKey', 'default')
      expect(result).toBe('default')
    })
  })

  describe('setItem', () => {
    it('should store stringified value', () => {
      const testData = { name: 'test' }
      setItem('testKey', testData)

      expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData))
    })
  })

  describe('STORAGE_KEYS', () => {
    it('should have all required keys', () => {
      expect(STORAGE_KEYS.CLAW_TOKEN).toBe('clawToken')
      expect(STORAGE_KEYS.AGENT_INFO).toBe('agentInfo')
      expect(STORAGE_KEYS.THEME).toBe('theme')
    })
  })
})
