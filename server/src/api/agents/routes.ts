/**
 * Agent API Routes
 */

import { Router } from 'express';
import { AgentManager } from '../../services/AgentManager';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { IUserStore } from '../../data/IUserStore';
import { z } from 'zod';

const selfRegisterSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email().optional(),
  displayName: z.string().max(100).optional(),
  metadata: z.record(z.any()).optional(),
});

const bindSchema = z.object({
  email: z.string().email(),
  greeting_msg: z.string().optional(),
});

export function createAgentRoutes(
  agentManager: AgentManager,
  userStore: IUserStore
): Router {
  const router = Router();

  /**
   * POST /api/claw/agents/selfRegister
   * Self-register a new agent
   */
  router.post('/selfRegister', async (req, res, next) => {
    try {
      const params = selfRegisterSchema.parse(req.body);
      const result = await agentManager.selfRegister(params);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/agents/bind
   * Bind agent to a human user by email
   */
  router.post('/bind', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = bindSchema.parse(req.body);
      const result = await agentManager.bind(req.agent!.id, params);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/agents/rotateToken
   * Rotate agent authentication token
   */
  router.post('/rotateToken', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const result = await agentManager.rotateToken(req.agent!.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/agents/get
   * Get agent details
   */
  router.post('/get', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const agent = await agentManager.getAgent(req.agent!.id);
      res.json({
        success: true,
        data: {
          id: agent.id,
          username: agent.username,
          displayName: agent.displayName,
          email: agent.email,
          workspaceId: agent.workspaceId,
          groupId: agent.groupId,
          isActive: agent.isActive,
          createdAt: agent.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
