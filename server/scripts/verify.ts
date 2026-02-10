/**
 * MoChat Server Verification Script
 *
 * This script performs comprehensive verification of the MoChat server:
 * 1. Server startup
 * 2. Agent registration
 * 3. Agent binding
 * 4. Session creation and messaging
 * 5. Panel creation and messaging
 * 6. Socket.io real-time events
 * 7. Token rotation
 */

import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let testsPassed = 0;
let testsFailed = 0;

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  testsPassed++;
  log(`✓ ${message}`, colors.green);
}

function error(message: string, err?: any) {
  testsFailed++;
  log(`✗ ${message}`, colors.red);
  if (err) {
    console.error(err.response?.data || err.message || err);
  }
}

function info(message: string) {
  log(`ℹ ${message}`, colors.cyan);
}

function section(title: string) {
  log(`\n${'='.repeat(60)}`, colors.blue);
  log(title.toUpperCase(), colors.blue);
  log('='.repeat(60), colors.blue);
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function verifyServer() {
  section('MoChat Server Verification');
  info(`Testing server at: ${BASE_URL}\n`);

  let agent1Token: string;
  let agent2Token: string;
  let agent1Id: string;
  let agent2Id: string;
  let ownerUserId: string;
  let sessionId: string;
  let panelId: string;
  let workspaceId: string;
  let groupId: string;
  let socket1: Socket;
  let socket2: Socket;

  try {
    // 1. Health Check
    section('1. Health Check');
    try {
      const healthRes = await axios.get(`${BASE_URL}/health`);
      if (healthRes.data.status === 'ok') {
        success('Server is healthy');
        info(`  Connected users: ${healthRes.data.connectedUsers}`);
      } else {
        error('Server health check failed');
      }
    } catch (err) {
      error('Server is not reachable', err);
      process.exit(1);
    }

    // 2. Agent Registration
    section('2. Agent Registration');
    try {
      const agent1Res = await axios.post(`${BASE_URL}/api/claw/agents/selfRegister`, {
        username: 'verify_agent_1',
        email: 'agent1@verify.test',
        displayName: 'Verification Agent 1',
      });

      agent1Token = agent1Res.data.data.token;
      agent1Id = agent1Res.data.data.botUserId;
      workspaceId = agent1Res.data.data.workspaceId;
      groupId = agent1Res.data.data.groupId;

      success('Agent 1 registered successfully');
      info(`  Token: ${agent1Token.substring(0, 20)}...`);
      info(`  Agent ID: ${agent1Id}`);

      const agent2Res = await axios.post(`${BASE_URL}/api/claw/agents/selfRegister`, {
        username: 'verify_agent_2',
        email: 'agent2@verify.test',
        displayName: 'Verification Agent 2',
      });

      agent2Token = agent2Res.data.data.token;
      agent2Id = agent2Res.data.data.botUserId;

      success('Agent 2 registered successfully');
      info(`  Agent ID: ${agent2Id}`);
    } catch (err) {
      error('Agent registration failed', err);
      process.exit(1);
    }

    // 3. Agent Binding
    section('3. Agent Binding');
    try {
      const bindRes = await axios.post(
        `${BASE_URL}/api/claw/agents/bind`,
        {
          email: 'owner@verify.test',
          greeting_msg: 'Hello! I am your verification agent.',
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      ownerUserId = bindRes.data.data.ownerUserId;
      sessionId = bindRes.data.data.sessionId;

      success('Agent bound to owner successfully');
      info(`  Owner ID: ${ownerUserId}`);
      info(`  Session ID: ${sessionId}`);
    } catch (err) {
      error('Agent binding failed', err);
    }

    // 4. Session Creation and Messaging
    section('4. Session Creation and Messaging');
    try {
      // Create group session
      const sessionRes = await axios.post(
        `${BASE_URL}/api/claw/sessions/create`,
        {
          type: 'group',
          participants: [agent1Id, agent2Id],
          name: 'Verification Test Session',
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      const groupSessionId = sessionRes.data.data.id;
      success('Group session created');
      info(`  Session ID: ${groupSessionId}`);

      // Send message
      const msgRes = await axios.post(
        `${BASE_URL}/api/claw/sessions/send`,
        {
          sessionId: groupSessionId,
          content: 'Hello from Agent 1! This is a verification test.',
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      success('Message sent in session');
      info(`  Message ID: ${msgRes.data.data.id}`);
      info(`  Content: ${msgRes.data.data.content}`);

      // Get messages
      const msgsRes = await axios.post(
        `${BASE_URL}/api/claw/sessions/messages`,
        {
          sessionId: groupSessionId,
          limit: 10,
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      success(`Retrieved ${msgsRes.data.data.items.length} message(s) from session`);

      // List sessions
      const listRes = await axios.post(
        `${BASE_URL}/api/claw/sessions/list`,
        {},
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      success(`Agent has ${listRes.data.data.length} session(s)`);
    } catch (err) {
      error('Session operations failed', err);
    }

    // 5. Panel Creation and Messaging
    section('5. Panel Creation and Messaging');
    try {
      // Create panel
      const panelRes = await axios.post(
        `${BASE_URL}/api/claw/groups/panels/create`,
        {
          groupId: groupId,
          name: 'Verification Test Panel',
          description: 'Panel for verification testing',
          isPublic: true,
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      panelId = panelRes.data.data.id;
      success('Panel created');
      info(`  Panel ID: ${panelId}`);
      info(`  Panel Name: ${panelRes.data.data.name}`);

      // Send panel message
      const panelMsgRes = await axios.post(
        `${BASE_URL}/api/claw/groups/panels/send`,
        {
          panelId: panelId,
          content: 'Hello everyone! This is a panel message for verification.',
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      success('Message sent to panel');
      info(`  Message ID: ${panelMsgRes.data.data.id}`);

      // Get panel messages
      const panelMsgsRes = await axios.post(
        `${BASE_URL}/api/claw/groups/panels/messages`,
        {
          panelId: panelId,
          limit: 10,
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      success(`Retrieved ${panelMsgsRes.data.data.items.length} message(s) from panel`);

      // Get workspace groups
      const groupsRes = await axios.post(
        `${BASE_URL}/api/claw/groups/get`,
        {
          workspaceId: workspaceId,
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      success('Retrieved workspace groups and panels');
      info(`  Workspace: ${groupsRes.data.data.workspace.name}`);
      info(`  Groups: ${groupsRes.data.data.groups.length}`);
    } catch (err) {
      error('Panel operations failed', err);
    }

    // 6. Socket.io Real-time Events
    section('6. Socket.io Real-time Events');
    try {
      await new Promise<void>((resolve, reject) => {
        let messageReceived = false;

        // Connect agent 2 via Socket.io
        socket2 = io(BASE_URL, {
          auth: { token: agent2Token },
        });

        socket2.on('connect', () => {
          success('Agent 2 connected via Socket.io');
          info(`  Socket ID: ${socket2.id}`);

          // Subscribe to all sessions
          socket2.emit('session:subscribe', { sessionId: '*' });
          info('  Subscribed to all sessions');

          // Wait a bit for subscription
          setTimeout(async () => {
            // Agent 1 sends a message
            try {
              await axios.post(
                `${BASE_URL}/api/claw/sessions/send`,
                {
                  sessionId: sessionId,
                  content: 'Real-time test message via Socket.io!',
                },
                {
                  headers: { 'X-Claw-Token': agent1Token },
                }
              );
              success('Message sent by Agent 1');
            } catch (err) {
              error('Failed to send message', err);
              reject(err);
            }
          }, 500);
        });

        socket2.on('notify:session', (data) => {
          if (!messageReceived) {
            messageReceived = true;
            success('Agent 2 received real-time session message');
            info(`  Session ID: ${data.sessionId}`);
            info(`  Message: ${data.message.content}`);
            info(`  Sender: ${data.sender.username}`);
            socket2.disconnect();
            resolve();
          }
        });

        socket2.on('connect_error', (err) => {
          error('Socket.io connection failed', err);
          reject(err);
        });

        // Timeout after 5 seconds
        setTimeout(() => {
          if (!messageReceived) {
            error('Socket.io message timeout - no message received');
            socket2.disconnect();
            resolve(); // Don't fail the whole test
          }
        }, 5000);
      });
    } catch (err) {
      error('Socket.io testing failed', err);
    }

    // 7. Token Rotation
    section('7. Token Rotation');
    try {
      const rotateRes = await axios.post(
        `${BASE_URL}/api/claw/agents/rotateToken`,
        {},
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      const newToken = rotateRes.data.data.token;
      success('Token rotated successfully');
      info(`  Old token: ${agent1Token.substring(0, 20)}...`);
      info(`  New token: ${newToken.substring(0, 20)}...`);

      // Verify old token doesn't work
      try {
        await axios.post(
          `${BASE_URL}/api/claw/agents/get`,
          {},
          {
            headers: { 'X-Claw-Token': agent1Token },
          }
        );
        error('Old token still works (should have been invalidated)');
      } catch (err) {
        if (err.response?.status === 401) {
          success('Old token correctly invalidated');
        } else {
          error('Unexpected error with old token', err);
        }
      }

      // Verify new token works
      const getAgentRes = await axios.post(
        `${BASE_URL}/api/claw/agents/get`,
        {},
        {
          headers: { 'X-Claw-Token': newToken },
        }
      );

      success('New token works correctly');
      info(`  Agent: ${getAgentRes.data.data.username}`);
    } catch (err) {
      error('Token rotation failed', err);
    }

    // 8. User Resolution
    section('8. User Resolution');
    try {
      const resolveRes = await axios.post(
        `${BASE_URL}/api/claw/users/resolve`,
        {
          userIds: [agent1Id, agent2Id, ownerUserId],
        },
        {
          headers: { 'X-Claw-Token': agent1Token },
        }
      );

      success(`Resolved ${resolveRes.data.data.length} user(s)`);
      resolveRes.data.data.forEach((user: any) => {
        info(`  - ${user.username} (${user.type})`);
      });
    } catch (err) {
      error('User resolution failed', err);
    }

    // Summary
    section('Verification Summary');
    const total = testsPassed + testsFailed;
    const successRate = ((testsPassed / total) * 100).toFixed(1);

    log(`\nTotal Tests: ${total}`, colors.cyan);
    log(`Passed: ${testsPassed}`, colors.green);
    log(`Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.green);
    log(`Success Rate: ${successRate}%\n`, colors.cyan);

    if (testsFailed === 0) {
      log('🎉 All verifications passed! MoChat server is fully functional.', colors.green);
      process.exit(0);
    } else {
      log(`⚠️  ${testsFailed} verification(s) failed. Please check the logs above.`, colors.yellow);
      process.exit(1);
    }
  } catch (err) {
    error('Unexpected error during verification', err);
    process.exit(1);
  } finally {
    // Cleanup
    if (socket1?.connected) socket1.disconnect();
    if (socket2?.connected) socket2.disconnect();
  }
}

// Run verification
verifyServer().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
