/**
 * Session API Routes
 */

import { Router } from 'express';
import { SessionManager } from '../../services/SessionManager';
import { EventStreamer } from '../../services/EventStreamer';
import { MessageRouter } from '../../services/MessageRouter';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { IUserStore } from '../../data/IUserStore';
import { SessionType, MessageType } from '../../types';
import { z } from 'zod';

const createSessionSchema = z.object({
  type: z.nativeEnum(SessionType),
  participants: z.array(z.string()),
  name: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const sendMessageSchema = z.object({
  sessionId: z.string(),
  content: z.string(),
  type: z.nativeEnum(MessageType).optional(),
  replyTo: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const getMessagesSchema = z.object({
  sessionId: z.string(),
  limit: z.number().optional(),
  cursor: z.string().optional(),
});

const addParticipantsSchema = z.object({
  sessionId: z.string(),
  participantIds: z.array(z.string()),
});

const removeParticipantsSchema = z.object({
  sessionId: z.string(),
  participantIds: z.array(z.string()),
});

export function createSessionRoutes(
  sessionManager: SessionManager,
  eventStreamer: EventStreamer,
  messageRouter: MessageRouter,
  userStore: IUserStore
): Router {
  const router = Router();

  /**
   * POST /api/claw/sessions/create
   * Create a new session
   */
  router.post('/create', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = createSessionSchema.parse(req.body);
      const session = await sessionManager.createSession({
        ...params,
        createdBy: req.agent!.id,
      });
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/sessions/get
   * Get session info
   */
  router.post('/get', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { sessionId } = req.body;
      const session = await sessionManager.getSession(sessionId, req.agent!.id);
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/sessions/detail
   * Get detailed session info
   */
  router.post('/detail', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { sessionId } = req.body;
      const detail = await sessionManager.getSessionDetail(sessionId, req.agent!.id);
      res.json({
        success: true,
        data: detail,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/sessions/list
   * List all sessions for user
   */
  router.post('/list', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const sessions = await sessionManager.listSessions(req.agent!.id);
      res.json({
        success: true,
        data: sessions,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/sessions/send
   * Send a message in a session
   */
  router.post('/send', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = sendMessageSchema.parse(req.body);
      const message = await sessionManager.sendMessage({
        ...params,
        senderId: req.agent!.id,
      });

      // Broadcast to subscribers
      const sender = userStore.getUserById(req.agent!.id);
      if (sender) {
        await eventStreamer.broadcastSessionMessage(
          params.sessionId,
          message,
          sender
        );
      }

      res.json({
        success: true,
        data: message,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/sessions/messages
   * Get messages in a session
   */
  router.post('/messages', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = getMessagesSchema.parse(req.body);
      const result = await sessionManager.getMessages(
        params.sessionId,
        req.agent!.id,
        {
          limit: params.limit,
          cursor: params.cursor,
        }
      );
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/sessions/addParticipants
   * Add participants to a session
   */
  router.post('/addParticipants', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = addParticipantsSchema.parse(req.body);
      const session = await sessionManager.addParticipants(
        params.sessionId,
        req.agent!.id,
        params.participantIds
      );
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/sessions/removeParticipants
   * Remove participants from a session
   */
  router.post('/removeParticipants', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = removeParticipantsSchema.parse(req.body);
      const session = await sessionManager.removeParticipants(
        params.sessionId,
        req.agent!.id,
        params.participantIds
      );
      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/sessions/close
   * Close a session
   */
  router.post('/close', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { sessionId } = req.body;
      await sessionManager.closeSession(sessionId, req.agent!.id);
      res.json({
        success: true,
        message: 'Session closed successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
