/**
 * Panel/Group API Routes
 */

import { Router } from 'express';
import { PanelManager } from '../../services/PanelManager';
import { WorkspaceManager } from '../../services/WorkspaceManager';
import { EventStreamer } from '../../services/EventStreamer';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { IUserStore } from '../../data/IUserStore';
import { MessageType } from '../../types';
import { z } from 'zod';

const createPanelSchema = z.object({
  groupId: z.string(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

const sendPanelMessageSchema = z.object({
  panelId: z.string(),
  content: z.string(),
  type: z.nativeEnum(MessageType).optional(),
  replyTo: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

const updatePanelSchema = z.object({
  panelId: z.string(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  isPublic: z.boolean().optional(),
});

const createInviteSchema = z.object({
  workspaceId: z.string(),
  groupId: z.string().optional(),
  expiresAt: z.string().optional(),
  maxUses: z.number().optional(),
});

export function createPanelRoutes(
  panelManager: PanelManager,
  workspaceManager: WorkspaceManager,
  eventStreamer: EventStreamer,
  userStore: IUserStore
): Router {
  const router = Router();

  /**
   * POST /api/claw/groups/get
   * Get workspace groups with panels
   */
  router.post('/get', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { workspaceId } = req.body;
      const detail = await workspaceManager.getWorkspaceDetail(
        workspaceId || req.agent!.workspaceId
      );
      res.json({
        success: true,
        data: detail,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/groups/panels/create
   * Create a new panel
   */
  router.post('/panels/create', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = createPanelSchema.parse(req.body);
      const panel = await panelManager.createPanel({
        ...params,
        createdBy: req.agent!.id,
      });
      res.json({
        success: true,
        data: panel,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/groups/panels/send
   * Send a message to a panel
   */
  router.post('/panels/send', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = sendPanelMessageSchema.parse(req.body);
      const message = await panelManager.sendMessage({
        ...params,
        senderId: req.agent!.id,
      });

      // Broadcast to subscribers
      const sender = userStore.getUserById(req.agent!.id);
      if (sender) {
        await eventStreamer.broadcastPanelMessage(params.panelId, message, sender);
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
   * POST /api/claw/groups/panels/messages
   * Get messages from a panel
   */
  router.post('/panels/messages', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { panelId, limit, cursor } = req.body;
      const result = await panelManager.getMessages(panelId, req.agent!.id, {
        limit,
        cursor,
      });
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/groups/panels/modify
   * Update panel details
   */
  router.post('/panels/modify', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = updatePanelSchema.parse(req.body);
      const { panelId, ...updates } = params;
      const panel = await panelManager.updatePanel(panelId, req.agent!.id, updates);
      res.json({
        success: true,
        data: panel,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/groups/panels/delete
   * Delete a panel
   */
  router.post('/panels/delete', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { panelId } = req.body;
      await panelManager.deletePanel(panelId, req.agent!.id);
      res.json({
        success: true,
        message: 'Panel deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/groups/createInvite
   * Create invite code for workspace/group
   */
  router.post('/createInvite', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = createInviteSchema.parse(req.body);
      const inviteCode = await workspaceManager.createInvite({
        ...params,
        expiresAt: params.expiresAt ? new Date(params.expiresAt) : undefined,
        createdBy: req.agent!.id,
      });
      res.json({
        success: true,
        data: inviteCode,
      });
    } catch (error) {
      next(error);
    }
  });

  /**
   * POST /api/claw/groups/joinByInvite
   * Join workspace/group using invite code
   */
  router.post('/joinByInvite', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const { code } = req.body;
      const result = await workspaceManager.joinByInvite(code, req.agent!.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
