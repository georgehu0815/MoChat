import { describe, it, expect, beforeEach } from 'vitest'
import { MessageDeduplicator, isDuplicateMessage, clearMessageDeduplication } from '../deduplication'

describe('MessageDeduplicator', () => {
  let deduplicator: MessageDeduplicator

  beforeEach(() => {
    deduplicator = new MessageDeduplicator(10, 5) // Small limit for testing
  })

  it('should detect first message as not duplicate', () => {
    expect(deduplicator.isDuplicate('msg1')).toBe(false)
  })

  it('should detect second occurrence as duplicate', () => {
    deduplicator.isDuplicate('msg1')
    expect(deduplicator.isDuplicate('msg1')).toBe(true)
  })

  it('should track multiple different messages', () => {
    expect(deduplicator.isDuplicate('msg1')).toBe(false)
    expect(deduplicator.isDuplicate('msg2')).toBe(false)
    expect(deduplicator.isDuplicate('msg3')).toBe(false)
    expect(deduplicator.size()).toBe(3)
  })

  it('should cleanup old messages when limit exceeded', () => {
    // Add 11 messages (limit is 10)
    for (let i = 0; i < 11; i++) {
      deduplicator.isDuplicate(`msg${i}`)
    }
    // Should trigger cleanup (removes 5)
    expect(deduplicator.size()).toBeLessThan(11)
  })

  it('should clear all messages', () => {
    deduplicator.isDuplicate('msg1')
    deduplicator.isDuplicate('msg2')
    deduplicator.clear()
    expect(deduplicator.size()).toBe(0)
  })
})

describe('global deduplication functions', () => {
  beforeEach(() => {
    clearMessageDeduplication()
  })

  it('should detect duplicates globally', () => {
    expect(isDuplicateMessage('global1')).toBe(false)
    expect(isDuplicateMessage('global1')).toBe(true)
  })
})
