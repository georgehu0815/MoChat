/**
 * Mention detection and parsing utilities
 */

/**
 * Extract user IDs from message content
 * Supports formats: @userId, @[userId], <@userId>
 */
export function extractMentions(content: string): string[] {
  const mentionRegex = /@\[([^\]]+)\]|<@([^>]+)>|@(\w+)/g;
  const mentions: string[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    const userId = match[1] || match[2] || match[3];
    if (userId && !mentions.includes(userId)) {
      mentions.push(userId);
    }
  }

  return mentions;
}

/**
 * Check if a user is mentioned in the message
 */
export function isMentioned(content: string, userId: string): boolean {
  const mentions = extractMentions(content);
  return mentions.includes(userId);
}

/**
 * Check if @all or @everyone is mentioned
 */
export function isMentionAll(content: string): boolean {
  return /@(all|everyone|channel|here)\b/i.test(content);
}
