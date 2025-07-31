import { Router } from 'express';
import { VpnController } from '../controllers/VpnController';
import { authenticateToken, requireUser, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/vpn/keys:
 *   get:
 *     summary: Get VPN keys
 *     tags: [VPN]
 *     security:
 *       - bearerAuth: []
 *       - oauth2: [read]
 *     responses:
 *       200:
 *         description: List of VPN keys
 */
router.get('/keys', authenticateToken, requireUser, VpnController.getKeys);

/**
 * @swagger
 * /api/vpn/keys:
 *   post:
 *     summary: Create a new VPN key
 *     tags: [VPN]
 *     security:
 *       - bearerAuth: []
 *       - oauth2: [write]
 *     responses:
 *       201:
 *         description: VPN key created successfully
 */
router.post('/keys', authenticateToken, requireUser, VpnController.createKey);

/**
 * @swagger
 * /api/vpn/keys/{id}:
 *   get:
 *     summary: Get VPN key info
 *     tags: [VPN]
 *     security:
 *       - bearerAuth: []
 *       - oauth2: [read]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: VPN key info
 */
router.get('/keys/:id', authenticateToken, requireUser, VpnController.getKey);

/**
 * @swagger
 * /api/vpn/keys/{id}:
 *   delete:
 *     summary: Delete VPN key
 *     tags: [VPN]
 *     security:
 *       - bearerAuth: []
 *       - oauth2: [write]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: VPN key deleted successfully
 */
router.delete('/keys/:id', authenticateToken, requireUser, VpnController.deleteKey);

/**
 * @swagger
 * /api/vpn/keys/{id}:
 *   put:
 *     summary: Update VPN key
 *     tags: [VPN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: VPN key updated successfully
 */
router.put('/keys/:id', authenticateToken, requireUser, VpnController.updateKey);


/**
 * @swagger
 * /api/vpn/keys/{outlineKeyId}/reassign:
 *   post:
 *     summary: Reassign key to another user (Admin only)
 *     tags: [VPN]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: outlineKeyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: number
 *     responses:
 *       200:
 *         description: Key reassigned successfully
 */
router.post('/keys/:outlineKeyId/reassign', authenticateToken, requireAdmin, VpnController.reassignKey);

export default router;