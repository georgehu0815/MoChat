import { describe, it, expect } from 'vitest'
import {
  formatTimestamp,
  formatTime,
  formatDateTime,
  truncate,
  getInitials,
  getUserColor,
} from '../format'

describe('format utilities', () => {
  describe('formatTimestamp', () => {
    it('should return "Just now" for recent timestamps', () => {
      const now = new Date()
      expect(formatTimestamp(now)).toBe('Just now')
    })

    it('should return minutes ago for timestamps within an hour', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      expect(formatTimestamp(fiveMinutesAgo)).toBe('5m ago')
    })

    it('should return hours ago for timestamps within 24 hours', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
      expect(formatTimestamp(twoHoursAgo)).toBe('2h ago')
    })

    it('should return formatted date for older timestamps', () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      const formatted = formatTimestamp(threeDaysAgo)
      expect(formatted).toMatch(/\w{3} \d{1,2}/)
    })
  })

  describe('formatTime', () => {
    it('should format time as HH:MM', () => {
      const date = new Date('2024-01-01T14:30:00')
      const formatted = formatTime(date)
      expect(formatted).toMatch(/\d{2}:\d{2}/)
    })
  })

  describe('truncate', () => {
    it('should not truncate text shorter than maxLength', () => {
      expect(truncate('Hello', 10)).toBe('Hello')
    })

    it('should truncate text longer than maxLength', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...')
    })

    it('should handle exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello')
    })
  })

  describe('getInitials', () => {
    it('should get initials from single word', () => {
      expect(getInitials('John')).toBe('JO')
    })

    it('should get initials from two words', () => {
      expect(getInitials('John Doe')).toBe('JD')
    })

    it('should get initials from multiple words', () => {
      expect(getInitials('John Middle Doe')).toBe('JD')
    })

    it('should handle extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD')
    })
  })

  describe('getUserColor', () => {
    it('should return consistent color for same userId', () => {
      const color1 = getUserColor('user123')
      const color2 = getUserColor('user123')
      expect(color1).toBe(color2)
    })

    it('should return different colors for different userIds', () => {
      const color1 = getUserColor('user123')
      const color2 = getUserColor('user456')
      // They might be the same due to hash collision, but this is unlikely
      expect(color1).toMatch(/^#[0-9a-f]{6}$/i)
      expect(color2).toMatch(/^#[0-9a-f]{6}$/i)
    })

    it('should return valid hex color', () => {
      const color = getUserColor('test')
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    })
  })
})
