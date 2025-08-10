import { Router } from 'express';
import { InviteController } from '../controllers/InviteController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/invites:
 *   post:
 *     summary: Create an invite for VPN client migration (admin only)
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vpnClientId
 *             properties:
 *               vpnClientId:
 *                 type: number
 *               email:
 *                 type: string
 *               expiresInDays:
 *                 type: number
 *                 default: 7
 *     responses:
 *       201:
 *         description: Invite created successfully
 */
router.post('/', authenticateToken, requireAdmin, InviteController.createInvite);

/**
 * @swagger
 * /api/invites:
 *   get:
 *     summary: Get all invites (admin only)
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invites
 */
router.get('/', authenticateToken, requireAdmin, InviteController.getInvites);

/**
 * @swagger
 * /api/invites/stats:
 *   get:
 *     summary: Get invite statistics (admin only)
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Invite statistics
 */
router.get('/stats', authenticateToken, requireAdmin, InviteController.getInviteStats);

/**
 * @swagger
 * /api/invites/validate/{token}:
 *   get:
 *     summary: Validate an invite token (public)
 *     tags: [Invites]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite validation result
 */
router.get('/validate/:token', InviteController.validateInvite);

/**
 * @swagger
 * /api/invites/use:
 *   post:
 *     summary: Use an invite to register (public)
 *     tags: [Invites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - email
 *               - name
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               email:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Registration completed successfully
 */
router.post('/use', InviteController.useInvite);

/**
 * @swagger
 * /api/invites/{id}:
 *   delete:
 *     summary: Delete an invite (admin only)
 *     tags: [Invites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Invite deleted successfully
 */
router.delete('/:id', authenticateToken, requireAdmin, InviteController.deleteInvite);

export default router;