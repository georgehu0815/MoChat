/**
 * LocalStorage utility functions with error handling
 */

export function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error)
    return defaultValue
  }
}

export function setItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error)
  }
}

export function removeItem(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error)
  }
}

export function clear(): void {
  try {
    localStorage.clear()
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

// Specific storage keys
export const STORAGE_KEYS = {
  CLAW_TOKEN: 'clawToken',
  AGENT_INFO: 'agentInfo',
  THEME: 'theme',
  CURSORS: 'messageCursors',
  SELECTED_SESSION: 'selectedSession',
  SELECTED_PANEL: 'selectedPanel',
}
