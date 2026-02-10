/**
 * Authentication middleware for X-Claw-Token
 */

import { Request, Response, NextFunction } from 'express';
import { IUserStore } from '../data/IUserStore';
import { Agent, UserType } from '../types';

export interface AuthenticatedRequest extends Request {
  agent?: Agent;
}

/**
 * Middleware to authenticate requests using X-Claw-Token header
 */
export function authenticate(userStore: IUserStore) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    // BYPASS: Skip authentication if DISABLE_AUTH is enabled
    if (process.env.DISABLE_AUTH === 'true') {
      console.log('⚠️  Authentication DISABLED  bypassing auth check - auth.ts:20');
      // Create a test agent for debugging (many routes depend on req.agent)
      req.agent = {
        id: 'test-agent-bypass',
        type: UserType.AGENT,
        username: 'test-agent',
        token: 'bypass-token',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      next();
      return;
    }

    const token = req.headers['x-claw-token'] as string;

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Missing X-Claw-Token header',
      });
      return;
    }

    const agent = userStore.getAgentByToken(token);

    if (!agent) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
      return;
    }

    if (!agent.isActive) {
      res.status(403).json({
        success: false,
        error: 'Agent is not active',
      });
      return;
    }

    req.agent = agent;
    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token provided
 */
export function optionalAuth(userStore: IUserStore) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const token = req.headers['x-claw-token'] as string;

    if (token) {
      const agent = userStore.getAgentByToken(token);
      if (agent && agent.isActive) {
        req.agent = agent;
      }
    }

    next();
  };
}
