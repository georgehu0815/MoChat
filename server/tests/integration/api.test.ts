/**
 * Integration tests for REST API endpoints
 */

import request from 'supertest';
import MoChatServer from '../../src/index';

describe('API Integration Tests', () => {
  let server: MoChatServer;
  let app: any;
  let agentToken: string;
  let agentUserId: string;
  let sessionId: string;

  beforeAll(async () => {
    server = new MoChatServer();
    app = server.getApp();
  });

  afterAll(async () => {
    await server.stop();
  });

  describe('Agent Registration Flow', () => {
    it('should register a new agent', async () => {
      const response = await request(app)
        .post('/api/claw/agents/selfRegister')
        .send({
          username: 'test_agent',
          email: 'agent@test.com',
          displayName: 'Test Agent',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.botUserId).toBeDefined();
      expect(response.body.data.workspaceId).toBeDefined();

      agentToken = response.body.data.token;
      agentUserId = response.body.data.botUserId;
    });

    it('should bind agent to owner email', async () => {
      const response = await request(app)
        .post('/api/claw/agents/bind')
        .set('X-Claw-Token', agentToken)
        .send({
          email: 'owner@test.com',
          greeting_msg: 'Hello! I am your agent.',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ownerUserId).toBeDefined();
      expect(response.body.data.sessionId).toBeDefined();

      sessionId = response.body.data.sessionId;
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post('/api/claw/agents/bind')
        .send({
          email: 'owner@test.com',
        })
        .expect(401);
    });

    it('should fail with invalid token', async () => {
      await request(app)
        .post('/api/claw/agents/bind')
        .set('X-Claw-Token', 'claw_invalid')
        .send({
          email: 'owner@test.com',
        })
        .expect(401);
    });
  });

  describe('Session Management', () => {
    it('should send a message in session', async () => {
      const response = await request(app)
        .post('/api/claw/sessions/send')
        .set('X-Claw-Token', agentToken)
        .send({
          sessionId: sessionId,
          content: 'Hello from agent!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      expect(response.body.data.content).toBe('Hello from agent!');
      expect(response.body.data.senderId).toBe(agentUserId);
    });

    it('should get messages from session', async () => {
      const response = await request(app)
        .post('/api/claw/sessions/messages')
        .set('X-Claw-Token', agentToken)
        .send({
          sessionId: sessionId,
          limit: 10,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeDefined();
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should list all sessions', async () => {
      const response = await request(app)
        .post('/api/claw/sessions/list')
        .set('X-Claw-Token', agentToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should get session details', async () => {
      const response = await request(app)
        .post('/api/claw/sessions/detail')
        .set('X-Claw-Token', agentToken)
        .send({
          sessionId: sessionId,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.session).toBeDefined();
      expect(response.body.data.participants).toBeDefined();
      expect(response.body.data.messageCount).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return server health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.connectedUsers).toBeDefined();
    });
  });

  describe('Token Rotation', () => {
    it('should rotate agent token', async () => {
      const response = await request(app)
        .post('/api/claw/agents/rotateToken')
        .set('X-Claw-Token', agentToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.token).not.toBe(agentToken);

      const newToken = response.body.data.token;

      // Old token should not work
      await request(app)
        .post('/api/claw/agents/get')
        .set('X-Claw-Token', agentToken)
        .expect(401);

      // New token should work
      await request(app)
        .post('/api/claw/agents/get')
        .set('X-Claw-Token', newToken)
        .expect(200);

      agentToken = newToken;
    });
  });
});
