import { Router } from 'express';
import { VpnClientController } from '../controllers/VpnClientController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/vpn-clients:
 *   get:
 *     summary: Get all VPN clients (admin only)
 *     tags: [VPN Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of VPN clients
 */
router.get('/', authenticateToken, requireAdmin, VpnClientController.getVpnClients);

/**
 * @swagger
 * /api/vpn-clients:
 *   post:
 *     summary: Create a new VPN client (admin only)
 *     tags: [VPN Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               telegramId:
 *                 type: string  
 *               notes:
 *                 type: string
 *               migrationStatus:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       201:
 *         description: VPN client created successfully
 */
router.post('/', authenticateToken, requireAdmin, VpnClientController.createVpnClient);

/**
 * @swagger
 * /api/vpn-clients/stats:
 *   get:
 *     summary: Get VPN client statistics (admin only)
 *     tags: [VPN Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: VPN client statistics
 */
router.get('/stats', authenticateToken, requireAdmin, VpnClientController.getVpnClientStats);

/**
 * @swagger
 * /api/vpn-clients/{id}:
 *   get:
 *     summary: Get VPN client by ID (admin only)
 *     tags: [VPN Clients]
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
 *         description: VPN client details
 */
router.get('/:id', authenticateToken, requireAdmin, VpnClientController.getVpnClient);

/**
 * @swagger
 * /api/vpn-clients/{id}:
 *   put:
 *     summary: Update VPN client (admin only)
 *     tags: [VPN Clients]
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
 *               phone:
 *                 type: string
 *               telegramId:
 *                 type: string  
 *               notes:
 *                 type: string
 *               migrationStatus:
 *                 type: string
 *                 enum: [PENDING, IN_PROGRESS, COMPLETED]
 *     responses:
 *       200:
 *         description: VPN client updated successfully
 */
router.put('/:id', authenticateToken, requireAdmin, VpnClientController.updateVpnClient);

/**
 * @swagger
 * /api/vpn-clients/{id}:
 *   delete:
 *     summary: Delete VPN client (admin only)
 *     tags: [VPN Clients]
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
 *         description: VPN client deleted successfully
 */
router.delete('/:id', authenticateToken, requireAdmin, VpnClientController.deleteVpnClient);

export default router;