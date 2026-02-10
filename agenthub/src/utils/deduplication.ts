import { MESSAGE_DEDUPE_LIMIT, MESSAGE_DEDUPE_CLEANUP_SIZE } from '../config/constants'

/**
 * Message deduplication tracker
 * Reference: /Users/ghu/aiworker/MoChat/adapters/openclaw/src/socket.ts
 *
 * Keeps track of last 2000 message IDs to prevent displaying duplicates
 */
export class MessageDeduplicator {
  private seenMessageIds: Set<string>
  private messageIdQueue: string[]
  private limit: number
  private cleanupSize: number

  constructor(limit = MESSAGE_DEDUPE_LIMIT, cleanupSize = MESSAGE_DEDUPE_CLEANUP_SIZE) {
    this.seenMessageIds = new Set()
    this.messageIdQueue = []
    this.limit = limit
    this.cleanupSize = cleanupSize
  }

  /**
   * Check if a message ID has been seen before
   * If not, add it to the tracker
   */
  isDuplicate(messageId: string): boolean {
    if (this.seenMessageIds.has(messageId)) {
      return true
    }

    // Add to tracking
    this.seenMessageIds.add(messageId)
    this.messageIdQueue.push(messageId)

    // Cleanup old entries if limit exceeded
    if (this.seenMessageIds.size > this.limit) {
      this.cleanup()
    }

    return false
  }

  /**
   * Remove oldest entries to maintain the limit
   */
  private cleanup(): void {
    const toRemove = this.messageIdQueue.splice(0, this.cleanupSize)
    toRemove.forEach(id => this.seenMessageIds.delete(id))
    console.log(`Cleaned up ${toRemove.length} old message IDs`)
  }

  /**
   * Clear all tracked message IDs
   */
  clear(): void {
    this.seenMessageIds.clear()
    this.messageIdQueue = []
  }

  /**
   * Get current size
   */
  size(): number {
    return this.seenMessageIds.size
  }
}

// Singleton instance for global deduplication
const globalDeduplicator = new MessageDeduplicator()

export function isDuplicateMessage(messageId: string): boolean {
  return globalDeduplicator.isDuplicate(messageId)
}

export function clearMessageDeduplication(): void {
  globalDeduplicator.clear()
}

export default globalDeduplicator
