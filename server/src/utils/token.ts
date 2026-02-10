/**
 * Token generation and validation utilities
 */

import { randomBytes } from 'crypto';

const TOKEN_PREFIX = 'claw_';
const TOKEN_LENGTH = 32;

/**
 * Generate a new claw token
 */
export function generateToken(): string {
  const randomString = randomBytes(TOKEN_LENGTH)
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/\//g, '')
    .replace(/=/g, '')
    .substring(0, TOKEN_LENGTH);

  return TOKEN_PREFIX + randomString;
}

/**
 * Validate token format
 */
export function validateTokenFormat(token: string): boolean {
  return token.startsWith(TOKEN_PREFIX) && token.length > TOKEN_PREFIX.length;
}
