/**
 * Authentication middleware for X-Claw-Token
 */

import { Request, Response, NextFunction } from 'express';
import { IUserStore } from '../data/IUserStore';
import { Agent } from '../types';

export interface AuthenticatedRequest extends Request {
  agent?: Agent;
}

/**
 * Middleware to authenticate requests using X-Claw-Token header
 */
export function authenticate(userStore: IUserStore) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
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
