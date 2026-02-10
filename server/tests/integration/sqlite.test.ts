/**
 * SQLite Integration Tests
 */

import request from 'supertest';
import { MoChatServer } from '../../src/index';
import { unlinkSync } from 'fs';
import { join } from 'path';

describe('SQLite Integration', () => {
  let server: MoChatServer;
  const testDbPath = join(__dirname, '../../data/integration-test.db');

  beforeAll(() => {
    // Set environment variable for SQLite
    process.env.USE_SQLITE = 'true';
    process.env.DB_PATH = testDbPath;

    // Clean up any existing test database
    try {
      unlinkSync(testDbPath);
    } catch (e) {
      // File doesn't exist, that's fine
    }
  });

  beforeEach(async () => {
    server = new MoChatServer();
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  afterAll(() => {
    try {
      unlinkSync(testDbPath);
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('Stats Endpoint with SQLite', () => {
    it('should return initial stats (all zeros)', async () => {
      const response = await request(server.getApp()).get('/api/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('agentCount');
      expect(response.body).toHaveProperty('sessionCount');
      expect(response.body.agentCount).toBe(0);
    });

    it('should update stats after creating agents', async () => {
      // Register an agent
      const registerResponse = await request(server.getApp())
        .post('/api/claw/agents/selfRegister')
        .send({
          username: 'testagent@example.com',
          displayName: 'Test Agent',
        });

      expect(registerResponse.status).toBe(200);

      // Check stats
      const statsResponse = await request(server.getApp()).get('/api/stats');

      expect(statsResponse.status).toBe(200);
      expect(statsResponse.body.agentCount).toBeGreaterThan(0);
    });

    it('should persist stats across server restarts', async () => {
      // Register an agent
      const registerResponse = await request(server.getApp())
        .post('/api/claw/agents/selfRegister')
        .send({
          username: 'persistent@example.com',
          displayName: 'Persistent Agent',
        });

      expect(registerResponse.status).toBe(200);

      // Get stats before restart
      const statsBefore = await request(server.getApp()).get('/api/stats');
      const agentCountBefore = statsBefore.body.agentCount;

      // Stop and restart server
      await server.stop();
      server = new MoChatServer();
      await server.start();

      // Get stats after restart
      const statsAfter = await request(server.getApp()).get('/api/stats');

      expect(statsAfter.body.agentCount).toBe(agentCountBefore);
    });
  });

  describe('Agent Operations with SQLite', () => {
    it('should persist agent registration', async () => {
      const response = await request(server.getApp())
        .post('/api/claw/agents/selfRegister')
        .send({
          username: 'sqlite_agent@example.com',
          displayName: 'SQLite Agent',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('agentId');
      expect(response.body.data).toHaveProperty('token');

      const { token } = response.body.data;

      // Restart server
      await server.stop();
      server = new MoChatServer();
      await server.start();

      // Verify agent still exists by using token
      const bindResponse = await request(server.getApp())
        .post('/api/claw/agents/bind')
        .set('X-Claw-Token', token)
        .send({
          userId: 'test-user-123',
        });

      // Should work if agent exists
      expect(bindResponse.status).toBe(200);
    });

    it('should rotate token with persistence', async () => {
      // Register agent
      const registerResponse = await request(server.getApp())
        .post('/api/claw/agents/selfRegister')
        .send({
          username: 'rotate_test@example.com',
          displayName: 'Rotate Test',
        });

      const { token: oldToken } = registerResponse.body.data;

      // Rotate token
      const rotateResponse = await request(server.getApp())
        .post('/api/claw/agents/rotateToken')
        .set('X-Claw-Token', oldToken);

      expect(rotateResponse.status).toBe(200);
      const { newToken } = rotateResponse.body.data;

      // Restart server
      await server.stop();
      server = new MoChatServer();
      await server.start();

      // Old token should not work
      const oldTokenTest = await request(server.getApp())
        .post('/api/claw/agents/bind')
        .set('X-Claw-Token', oldToken)
        .send({ userId: 'test-user' });

      expect(oldTokenTest.status).toBe(401);

      // New token should work
      const newTokenTest = await request(server.getApp())
        .post('/api/claw/agents/bind')
        .set('X-Claw-Token', newToken)
        .send({ userId: 'test-user' });

      expect(newTokenTest.status).toBe(200);
    });
  });

  describe('Health Check', () => {
    it('should return server health', async () => {
      const response = await request(server.getApp()).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('connectedUsers');
    });
  });

  describe('Database Integrity', () => {
    it('should handle concurrent operations', async () => {
      // Create multiple agents concurrently
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(server.getApp())
            .post('/api/claw/agents/selfRegister')
            .send({
              username: `concurrent${i}@example.com`,
              displayName: `Concurrent Agent ${i}`,
            })
        );
      }

      const responses = await Promise.all(promises);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      // Check stats
      const statsResponse = await request(server.getApp()).get('/api/stats');
      expect(statsResponse.body.agentCount).toBeGreaterThanOrEqual(5);
    });

    it('should enforce unique constraints', async () => {
      const username = 'unique_test@example.com';

      // Create first agent
      const response1 = await request(server.getApp())
        .post('/api/claw/agents/selfRegister')
        .send({
          username,
          displayName: 'First Agent',
        });

      expect(response1.status).toBe(200);

      // Try to create duplicate
      const response2 = await request(server.getApp())
        .post('/api/claw/agents/selfRegister')
        .send({
          username,
          displayName: 'Duplicate Agent',
        });

      // Should fail due to unique constraint
      expect(response2.status).toBeGreaterThanOrEqual(400);
    });
  });
});
