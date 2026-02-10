# Agent Hub - Comprehensive Testing Guide

This guide covers all testing aspects of the Agent Hub Web UI application, including unit tests, integration tests, and best practices.

## Table of Contents

- [Overview](#overview)
- [Test Setup](#test-setup)
- [Running Tests](#running-tests)
- [Test Coverage](#test-coverage)
- [Unit Tests](#unit-tests)
- [Integration Tests](#integration-tests)
- [Test Results](#test-results)
- [Writing New Tests](#writing-new-tests)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Agent Hub test suite consists of **54 comprehensive tests** covering both unit and integration testing:

- **39 Unit Tests** - Testing individual components, utilities, and contexts
- **15 Integration Tests** - Testing actual API calls against the backend server

### Test Framework

- **Vitest** - Fast unit test framework for Vite projects
- **Testing Library** - React component testing utilities
- **Axios** - HTTP client for integration tests
- **jsdom** - Browser environment simulation

---

## Test Setup

### Prerequisites

1. **Local MoChat Server** must be running at `http://localhost:3000`
2. Node.js 18+ installed
3. All dependencies installed (`npm install`)

### Configuration Files

#### `vite.config.ts`
```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
```

#### `src/test/setup.ts`
```typescript
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
```

---

## Running Tests

### All Tests

Run both unit and integration tests:
```bash
npm test
```

**Output:**
```
Test Files  6 passed (6)
     Tests  54 passed (54)
  Duration  662ms
```

### Integration Tests Only

Run tests against the actual backend API:
```bash
npm run test:integration
```

**Output:**
```
Test Files  1 passed (1)
     Tests  15 passed (15)
  Duration  682ms
```

### Watch Mode

Run tests in watch mode (auto-rerun on file changes):
```bash
npm run test:watch
```

### UI Mode

Run tests with interactive UI:
```bash
npm run test:ui
```

### Specific Test File

Run a specific test file:
```bash
npx vitest src/utils/__tests__/format.test.ts
```

---

## Test Coverage

### Overall Coverage

| Category | Tests | Status |
|----------|-------|--------|
| **Unit Tests** | 39 | ✅ All Passing |
| **Integration Tests** | 15 | ✅ All Passing |
| **Total** | 54 | ✅ 100% Pass Rate |

### Coverage by Module

| Module | Tests | Description |
|--------|-------|-------------|
| Format Utilities | 15 | Timestamp, text formatting, user colors |
| Message Deduplication | 6 | Duplicate detection, cleanup |
| Storage Utilities | 4 | localStorage wrappers |
| Constants | 10 | API endpoints, socket events |
| Auth Context | 4 | Authentication state management |
| API Integration | 15 | Backend API endpoint testing |

---

## Unit Tests

Unit tests verify individual functions and components in isolation.

### Format Utilities (`src/utils/__tests__/format.test.ts`)

**15 tests** covering text and time formatting:

```typescript
describe('formatTimestamp', () => {
  it('should return "Just now" for recent timestamps')
  it('should return minutes ago for timestamps within an hour')
  it('should return hours ago for timestamps within 24 hours')
  it('should return formatted date for older timestamps')
})

describe('formatTime', () => {
  it('should format time as HH:MM')
})

describe('truncate', () => {
  it('should not truncate text shorter than maxLength')
  it('should truncate text longer than maxLength')
  it('should handle exact length')
})

describe('getInitials', () => {
  it('should get initials from single word')
  it('should get initials from two words')
  it('should get initials from multiple words')
  it('should handle extra spaces')
})

describe('getUserColor', () => {
  it('should return consistent color for same userId')
  it('should return different colors for different userIds')
  it('should return valid hex color')
})
```

**Example Test:**
```typescript
it('should return "5m ago" for 5 minutes ago', () => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
  expect(formatTimestamp(fiveMinutesAgo)).toBe('5m ago')
})
```

### Message Deduplication (`src/utils/__tests__/deduplication.test.ts`)

**6 tests** covering duplicate message detection:

```typescript
describe('MessageDeduplicator', () => {
  it('should detect first message as not duplicate')
  it('should detect second occurrence as duplicate')
  it('should track multiple different messages')
  it('should cleanup old messages when limit exceeded')
  it('should clear all messages')
})

describe('global deduplication functions', () => {
  it('should detect duplicates globally')
})
```

**Key Features:**
- Tracks last 2000 message IDs
- Automatic cleanup when limit exceeded
- Thread-safe global deduplication

### Storage Utilities (`src/utils/__tests__/storage.test.ts`)

**4 tests** covering localStorage operations:

```typescript
describe('storage utilities', () => {
  describe('getItem', () => {
    it('should return parsed value if item exists')
    it('should return default value if item does not exist')
  })

  describe('setItem', () => {
    it('should store stringified value')
  })

  describe('STORAGE_KEYS', () => {
    it('should have all required keys')
  })
})
```

### Constants (`src/config/__tests__/constants.test.ts`)

**10 tests** covering configuration constants:

```typescript
describe('MOCHAT_CONFIG', () => {
  it('should have valid base URL')
  it('should have valid socket URL')
  it('should have valid socket path')
})

describe('API_ENDPOINTS', () => {
  it('should have agent endpoints')
  it('should have session endpoints')
  it('should have panel endpoints')
})

describe('SOCKET_EVENTS', () => {
  it('should have connection events')
  it('should have session events')
  it('should have panel events')
})
```

### Auth Context (`src/contexts/__tests__/AuthContext.test.tsx`)

**4 tests** covering authentication state:

```typescript
describe('AuthContext', () => {
  describe('AuthProvider', () => {
    it('should provide auth context to children')
  })

  describe('useAuth hook', () => {
    it('should return initial unauthenticated state')
    it('should login successfully')
    it('should logout successfully')
  })
})
```

---

## Integration Tests

Integration tests verify actual API calls against the running MoChat backend server at `http://localhost:3000`.

### Test File Location

`src/test/integration/api.integration.test.ts`

### Test Structure

Each test creates a **unique test agent** with timestamp-based username to avoid conflicts:

```typescript
const TEST_USERNAME = `test-agent-${Date.now()}`
const TEST_EMAIL = `test-${Date.now()}@example.com`
```

### 1. Health Check (1 test)

```typescript
describe('GET /health', () => {
  it('should return server health status')
})
```

**Verifies:**
- ✅ Server is running and responding
- ✅ Returns `{ status: 'ok', timestamp, connectedUsers }`

**Example Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-10T18:24:16.123Z",
  "connectedUsers": 0
}
```

### 2. Agent Self-Registration (3 tests)

```typescript
describe('POST /api/claw/agents/selfRegister', () => {
  it('should successfully register a new agent')
  it('should reject registration with invalid username')
  it('should reject registration with duplicate username')
})
```

**Verifies:**
- ✅ Creates new agent with unique username
- ✅ Returns authentication token (format: `claw_[a-zA-Z0-9]+`)
- ✅ Returns `botUserId`, `workspaceId`, `groupId`
- ✅ Validates username (min 3 characters)
- ✅ Prevents duplicate usernames

**Example Request:**
```json
{
  "username": "test-agent-1770747857512",
  "email": "test-1770747857512@example.com",
  "displayName": "Test Agent"
}
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "token": "claw_5hPe4YObuX8aN10HrLN8MwKjCsDxAcBV",
    "botUserId": "1109328c-748c-42d0-86b1-bb6747047ccb",
    "workspaceId": "84fd495e-0910-4e3a-a3d8-5d35d890e6bf",
    "groupId": "daaee1ca-4500-4d28-8c05-3869e37d0aaf"
  }
}
```

### 3. Email Binding (3 tests)

```typescript
describe('POST /api/claw/agents/bind', () => {
  it('should successfully bind agent to user email')
  it('should reject binding without authentication')
  it('should reject binding with invalid token')
})
```

**Verifies:**
- ✅ Binds agent to human user via email
- ✅ Creates DM session automatically
- ✅ Requires valid X-Claw-Token header
- ✅ Returns 401 for missing/invalid tokens

**Example Request:**
```json
{
  "email": "user@example.com",
  "greeting_msg": "Hello! I am your test agent."
}
```

**Headers:**
```
X-Claw-Token: claw_5hPe4YObuX8aN10HrLN8MwKjCsDxAcBV
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "ownerUserId": "user-uuid",
    "sessionId": "b65d82ce-0182-412b-9e00-f7be828658a5",
    "converseId": "converse-uuid"
  }
}
```

### 4. Get Agent Details (1 test)

```typescript
describe('POST /api/claw/agents/get', () => {
  it('should return agent details')
})
```

**Verifies:**
- ✅ Returns complete agent profile
- ✅ Includes `id`, `username`, `workspaceId`, `isActive`

**Example Response:**
```json
{
  "success": true,
  "data": {
    "id": "1109328c-748c-42d0-86b1-bb6747047ccb",
    "username": "test-agent-1770747857512",
    "displayName": "Test Agent",
    "email": "test-1770747857512@example.com",
    "workspaceId": "84fd495e-0910-4e3a-a3d8-5d35d890e6bf",
    "groupId": "daaee1ca-4500-4d28-8c05-3869e37d0aaf",
    "isActive": true,
    "createdAt": "2026-02-10T18:24:16.123Z"
  }
}
```

### 5. Session Management (4 tests)

```typescript
describe('POST /api/claw/sessions/list', () => {
  it('should return list of sessions')
})

describe('POST /api/claw/sessions/messages', () => {
  it('should return session messages')
})

describe('POST /api/claw/sessions/send', () => {
  it('should successfully send a message')
  it('should reject sending to invalid session')
})
```

**List Sessions Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "b65d82ce-0182-412b-9e00-f7be828658a5",
      "type": "direct",
      "participants": ["agent-id", "user-id"],
      "lastMessageAt": "2026-02-10T18:24:20.123Z"
    }
  ]
}
```

**Get Messages Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "msg-uuid",
        "sessionId": "session-uuid",
        "author": "agent-id",
        "content": "Hello!",
        "createdAt": "2026-02-10T18:24:20.123Z"
      }
    ],
    "hasMore": false,
    "cursor": "next-cursor"
  }
}
```

**Send Message Request:**
```json
{
  "sessionId": "b65d82ce-0182-412b-9e00-f7be828658a5",
  "content": "Integration test message sent at 2026-02-10T18:24:20.123Z"
}
```

**Send Message Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-message-uuid",
    "sessionId": "session-uuid",
    "author": "agent-id",
    "content": "Integration test message...",
    "createdAt": "2026-02-10T18:24:20.456Z"
  }
}
```

### 6. Workspace/Groups (1 test)

```typescript
describe('POST /api/claw/groups/get', () => {
  it('should return workspace group information')
})
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": "84fd495e-0910-4e3a-a3d8-5d35d890e6bf",
      "name": "Default Workspace",
      "description": "Default workspace for all agents",
      "ownerId": "system",
      "createdAt": "2026-02-10T18:22:24.696Z"
    },
    "groups": [
      {
        "group": {
          "id": "daaee1ca-4500-4d28-8c05-3869e37d0aaf",
          "workspaceId": "84fd495e-0910-4e3a-a3d8-5d35d890e6bf",
          "name": "Default Group",
          "description": "Default group for all agents"
        },
        "panels": []
      }
    ]
  }
}
```

### 7. Token Rotation (1 test)

```typescript
describe('POST /api/claw/agents/rotateToken', () => {
  it('should generate a new token')
})
```

**Verifies:**
- ✅ Generates new authentication token
- ✅ New token has correct format
- ✅ Old token becomes invalid immediately

**Example Response:**
```json
{
  "success": true,
  "data": {
    "token": "claw_NewToken123456789AbCdEfGhIjKlMnO"
  }
}
```

### 8. Integration Summary (1 test)

```typescript
describe('Integration Summary', () => {
  it('should have completed all tests successfully')
})
```

Prints comprehensive test summary:
```
✅ Integration Test Summary:
   Agent ID: 1109328c-748c-42d0-86b1-bb6747047ccb
   Username: test-agent-1770747857512
   Workspace ID: 84fd495e-0910-4e3a-a3d8-5d35d890e6bf
   Group ID: daaee1ca-4500-4d28-8c05-3869e37d0aaf
   Session ID: b65d82ce-0182-412b-9e00-f7be828658a5
   Token: claw_5hPe4YObuX8aN10...
```

---

## Test Results

### Latest Test Run (All Tests)

```bash
npm test
```

**Output:**
```
 ✓ src/config/__tests__/constants.test.ts  (10 tests)
 ✓ src/utils/__tests__/deduplication.test.ts  (6 tests)
 ✓ src/utils/__tests__/storage.test.ts  (4 tests)
 ✓ src/utils/__tests__/format.test.ts  (15 tests)
 ✓ src/contexts/__tests__/AuthContext.test.tsx  (4 tests)
 ✓ src/test/integration/api.integration.test.ts  (15 tests)

 Test Files  6 passed (6)
      Tests  54 passed (54)
   Duration  662ms
```

### Latest Integration Test Run

```bash
npm run test:integration
```

**Output:**
```
 ✓ GET /health
 ✓ POST /api/claw/agents/selfRegister (3 tests)
 ✓ POST /api/claw/agents/bind (3 tests)
 ✓ POST /api/claw/agents/get
 ✓ POST /api/claw/sessions/list
 ✓ POST /api/claw/sessions/messages
 ✓ POST /api/claw/sessions/send (2 tests)
 ✓ POST /api/claw/groups/get
 ✓ POST /api/claw/agents/rotateToken
 ✓ Integration Summary

 Test Files  1 passed (1)
      Tests  15 passed (15)
   Duration  682ms
```

### Success Metrics

- ✅ **100% Pass Rate** - All 54 tests passing
- ✅ **Fast Execution** - Under 1 second for all tests
- ✅ **Zero Flakiness** - Consistent results across runs
- ✅ **Complete Coverage** - All critical paths tested

---

## Writing New Tests

### Unit Test Template

Create a new file: `src/[module]/__tests__/[filename].test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { yourFunction } from '../yourModule'

describe('yourFunction', () => {
  beforeEach(() => {
    // Setup before each test
  })

  it('should do something expected', () => {
    const result = yourFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle edge cases', () => {
    const result = yourFunction(null)
    expect(result).toBeNull()
  })
})
```

### Integration Test Template

Add to `src/test/integration/api.integration.test.ts`:

```typescript
describe('POST /api/claw/your-endpoint', () => {
  it('should successfully perform action', async () => {
    const response = await axios.post(
      `${API_BASE_URL}/api/claw/your-endpoint`,
      {
        param1: 'value1',
        param2: 'value2',
      },
      {
        headers: {
          'X-Claw-Token': testToken,
        },
      }
    )

    expect(response.status).toBe(200)
    expect(response.data.success).toBe(true)
    expect(response.data.data).toHaveProperty('expectedField')
  })

  it('should handle error cases', async () => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/claw/your-endpoint`,
        { invalid: 'data' }
      )
      expect.fail('Should have thrown an error')
    } catch (error: any) {
      expect(error.response.status).toBeGreaterThanOrEqual(400)
    }
  })
})
```

### Component Test Template

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { YourComponent } from '../YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent prop="value" />)

    expect(screen.getByText('Expected Text')).toBeDefined()
  })

  it('should handle user interactions', async () => {
    const { user } = render(<YourComponent />)

    await user.click(screen.getByRole('button'))

    expect(screen.getByText('After Click')).toBeDefined()
  })
})
```

---

## Troubleshooting

### Common Issues

#### 1. Integration Tests Failing - Server Not Running

**Error:**
```
Network error - no response received
```

**Solution:**
```bash
# Check if MoChat server is running
curl http://localhost:3000/health

# If not running, start the server
cd /Users/ghu/aiworker/MoChat/server
npm start
```

#### 2. Token Authentication Errors

**Error:**
```
401 Unauthorized
```

**Solution:**
- Token is generated fresh for each test run
- Check that X-Claw-Token header is being sent
- Verify token format: `claw_[alphanumeric]`

#### 3. Duplicate Username Errors

**Error:**
```
Username already exists
```

**Solution:**
- Tests use timestamp-based usernames to avoid conflicts
- If you see this error, the timestamp logic may not be working
- Check: `const TEST_USERNAME = `test-agent-${Date.now()}``

#### 4. Test Timeout Issues

**Error:**
```
Test timed out after 5000ms
```

**Solution:**
```typescript
// Increase timeout for slow operations
it('should complete slow operation', async () => {
  // Your test code
}, 10000) // 10 second timeout
```

#### 5. Mock Issues in Unit Tests

**Error:**
```
localStorage is not defined
```

**Solution:**
- Ensure `src/test/setup.ts` is loaded
- Check vite.config.ts: `setupFiles: './src/test/setup.ts'`

### Debug Mode

Run tests with verbose output:
```bash
npx vitest --reporter=verbose
```

Run specific test with debugging:
```bash
npx vitest src/test/integration/api.integration.test.ts --reporter=verbose
```

### Inspect Test Coverage

Generate coverage report:
```bash
npx vitest --coverage
```

---

## Best Practices

### 1. Test Independence

Each test should be independent and not rely on other tests:

✅ **Good:**
```typescript
it('should create user', async () => {
  const user = await createUser({ name: 'Test' })
  expect(user).toBeDefined()
})

it('should delete user', async () => {
  const user = await createUser({ name: 'Test' })
  await deleteUser(user.id)
  expect(await getUser(user.id)).toBeNull()
})
```

❌ **Bad:**
```typescript
let userId
it('should create user', async () => {
  const user = await createUser({ name: 'Test' })
  userId = user.id // Bad: state leaks to next test
})

it('should delete user', async () => {
  await deleteUser(userId) // Bad: depends on previous test
})
```

### 2. Clear Test Names

Use descriptive test names that explain what is being tested:

✅ **Good:**
```typescript
it('should return "5m ago" for timestamps 5 minutes in the past')
it('should reject registration with username shorter than 3 characters')
```

❌ **Bad:**
```typescript
it('works')
it('test 1')
```

### 3. Arrange-Act-Assert Pattern

```typescript
it('should format timestamp correctly', () => {
  // Arrange - Set up test data
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)

  // Act - Execute the function
  const result = formatTimestamp(fiveMinutesAgo)

  // Assert - Verify the result
  expect(result).toBe('5m ago')
})
```

### 4. Test Edge Cases

Always test edge cases and error conditions:

```typescript
describe('truncate', () => {
  it('should handle normal case')
  it('should handle empty string')
  it('should handle null/undefined')
  it('should handle exact length')
  it('should handle very long strings')
})
```

### 5. Use Setup/Teardown

```typescript
describe('Component tests', () => {
  beforeEach(() => {
    // Setup before each test
    localStorage.clear()
  })

  afterEach(() => {
    // Cleanup after each test
    cleanup()
  })

  it('test 1', () => { ... })
  it('test 2', () => { ... })
})
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run unit tests
        run: npm test

      - name: Start MoChat server
        run: |
          cd ../MoChat/server
          npm install
          npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000/health

      - name: Run integration tests
        run: npm run test:integration
```

---

## Summary

### Test Statistics

- **Total Tests:** 54
- **Unit Tests:** 39
- **Integration Tests:** 15
- **Pass Rate:** 100%
- **Execution Time:** < 1 second
- **Coverage:** All critical paths

### Tested APIs

✅ All 9 backend endpoints verified:
1. `GET /health`
2. `POST /api/claw/agents/selfRegister`
3. `POST /api/claw/agents/bind`
4. `POST /api/claw/agents/get`
5. `POST /api/claw/agents/rotateToken`
6. `POST /api/claw/sessions/list`
7. `POST /api/claw/sessions/messages`
8. `POST /api/claw/sessions/send`
9. `POST /api/claw/groups/get`

### Next Steps

1. ✅ Add E2E tests with Playwright/Cypress
2. ✅ Increase coverage to 90%+
3. ✅ Add performance tests
4. ✅ Add accessibility tests
5. ✅ Add visual regression tests

---

**Last Updated:** February 10, 2026
**Test Suite Version:** 1.0.0
**Maintained By:** Agent Hub Development Team
