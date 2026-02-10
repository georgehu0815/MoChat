/**
 * End-to-end tests with Socket.io client
 */

import { io, Socket } from 'socket.io-client';
import MoChatServer from '../../src/index';
import axios from 'axios';

describe('Socket.io E2E Tests', () => {
  let server: MoChatServer;
  let baseURL: string;
  let agent1Token: string;
  let agent2Token: string;
  let agent1Id: string;
  let agent2Id: string;
  let sessionId: string;
  let socket1: Socket;
  let socket2: Socket;

  beforeAll(async () => {
    server = new MoChatServer();
    await server.start();
    baseURL = 'http://localhost:3000';
  });

  afterAll(async () => {
    await server.stop();
  });

  beforeEach(async () => {
    // Register two agents
    const agent1Res = await axios.post(`${baseURL}/api/claw/agents/selfRegister`, {
      username: 'agent1',
      email: 'agent1@test.com',
    });
    agent1Token = agent1Res.data.data.token;
    agent1Id = agent1Res.data.data.botUserId;

    const agent2Res = await axios.post(`${baseURL}/api/claw/agents/selfRegister`, {
      username: 'agent2',
      email: 'agent2@test.com',
    });
    agent2Token = agent2Res.data.data.token;
    agent2Id = agent2Res.data.data.botUserId;

    // Create a session between agents
    const sessionRes = await axios.post(
      `${baseURL}/api/claw/sessions/create`,
      {
        type: 'group',
        participants: [agent1Id, agent2Id],
        name: 'Test Session',
      },
      {
        headers: { 'X-Claw-Token': agent1Token },
      }
    );
    sessionId = sessionRes.data.data.id;
  });

  afterEach(() => {
    if (socket1?.connected) socket1.disconnect();
    if (socket2?.connected) socket2.disconnect();
  });

  describe('Socket.io Connection', () => {
    it('should connect with valid token', (done) => {
      socket1 = io(baseURL, {
        auth: { token: agent1Token },
      });

      socket1.on('connect', () => {
        expect(socket1.connected).toBe(true);
        socket1.disconnect();
        done();
      });

      socket1.on('connect_error', (err) => {
        done(err);
      });
    });

    it('should reject connection with invalid token', (done) => {
      const badSocket = io(baseURL, {
        auth: { token: 'claw_invalid' },
      });

      badSocket.on('connect', () => {
        badSocket.disconnect();
        done(new Error('Should not connect with invalid token'));
      });

      badSocket.on('connect_error', (err) => {
        expect(err.message).toContain('Authentication error');
        badSocket.disconnect();
        done();
      });
    });
  });

  describe('Session Subscriptions', () => {
    it('should subscribe to session and receive messages', (done) => {
      socket1 = io(baseURL, { auth: { token: agent1Token } });
      socket2 = io(baseURL, { auth: { token: agent2Token } });

      let connectCount = 0;
      const checkReady = () => {
        connectCount++;
        if (connectCount === 2) {
          // Both connected, subscribe to session
          socket2.emit('session:subscribe', { sessionId });

          // Wait a bit for subscription to complete
          setTimeout(async () => {
            // Agent1 sends message
            await axios.post(
              `${baseURL}/api/claw/sessions/send`,
              {
                sessionId,
                content: 'Hello Agent2!',
              },
              {
                headers: { 'X-Claw-Token': agent1Token },
              }
            );
          }, 100);
        }
      };

      socket1.on('connect', checkReady);
      socket2.on('connect', checkReady);

      socket2.on('notify:session', (data) => {
        expect(data.sessionId).toBe(sessionId);
        expect(data.message.content).toBe('Hello Agent2!');
        expect(data.sender.id).toBe(agent1Id);
        socket1.disconnect();
        socket2.disconnect();
        done();
      });
    });

    it('should support wildcard session subscription', (done) => {
      socket1 = io(baseURL, { auth: { token: agent1Token } });

      socket1.on('connect', () => {
        // Subscribe to all sessions
        socket1.emit('session:subscribe', { sessionId: '*' });

        setTimeout(async () => {
          // Create and send message to new session
          const newSessionRes = await axios.post(
            `${baseURL}/api/claw/sessions/create`,
            {
              type: 'group',
              participants: [agent1Id, agent2Id],
              name: 'New Session',
            },
            {
              headers: { 'X-Claw-Token': agent1Token },
            }
          );

          const newSessionId = newSessionRes.data.data.id;

          await axios.post(
            `${baseURL}/api/claw/sessions/send`,
            {
              sessionId: newSessionId,
              content: 'Test wildcard',
            },
            {
              headers: { 'X-Claw-Token': agent2Token },
            }
          );
        }, 100);
      });

      socket1.on('notify:session', (data) => {
        if (data.message.content === 'Test wildcard') {
          socket1.disconnect();
          done();
        }
      });
    });
  });

  describe('Panel Subscriptions', () => {
    it('should subscribe to panel and receive messages', (done) => {
      let panelId: string;

      socket1 = io(baseURL, { auth: { token: agent1Token } });
      socket2 = io(baseURL, { auth: { token: agent2Token } });

      let connectCount = 0;
      const checkReady = () => {
        connectCount++;
        if (connectCount === 2) {
          // Create panel
          axios
            .post(
              `${baseURL}/api/claw/groups/panels/create`,
              {
                groupId: 'default-group',
                name: 'Test Panel',
                isPublic: true,
              },
              {
                headers: { 'X-Claw-Token': agent1Token },
              }
            )
            .then((res) => {
              panelId = res.data.data.id;

              // Subscribe to panel
              socket2.emit('panel:subscribe', { panelId });

              setTimeout(async () => {
                // Send panel message
                await axios.post(
                  `${baseURL}/api/claw/groups/panels/send`,
                  {
                    panelId,
                    content: 'Panel message!',
                  },
                  {
                    headers: { 'X-Claw-Token': agent1Token },
                  }
                );
              }, 100);
            });
        }
      };

      socket1.on('connect', checkReady);
      socket2.on('connect', checkReady);

      socket2.on('notify:panel', (data) => {
        expect(data.panelId).toBe(panelId);
        expect(data.message.content).toBe('Panel message!');
        socket1.disconnect();
        socket2.disconnect();
        done();
      });
    });
  });
});
