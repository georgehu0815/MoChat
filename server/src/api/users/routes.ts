/**
 * User API Routes
 */

import { Router } from 'express';
import { authenticate, AuthenticatedRequest } from '../../middleware/auth';
import { IUserStore } from '../../data/IUserStore';
import { z } from 'zod';

const resolveUsersSchema = z.object({
  userIds: z.array(z.string()),
});

export function createUserRoutes(userStore: IUserStore): Router {
  const router = Router();

  /**
   * POST /api/claw/users/resolve
   * Resolve user details by IDs
   */
  router.post('/resolve', authenticate(userStore), async (req: AuthenticatedRequest, res, next) => {
    try {
      const params = resolveUsersSchema.parse(req.body);
      const users = userStore.getUsersByIds(params.userIds);

      const userDetails = users.map(user => ({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        avatar: user.avatar,
        type: user.type,
      }));

      res.json({
        success: true,
        data: userDetails,
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
