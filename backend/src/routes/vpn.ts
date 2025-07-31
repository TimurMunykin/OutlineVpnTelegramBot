import { Router } from 'express';

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
router.get('/keys', (req, res) => {
  res.json({ message: 'Get VPN keys endpoint - TODO' });
});

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
router.post('/keys', (req, res) => {
  res.json({ message: 'Create VPN key endpoint - TODO' });
});

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
router.get('/keys/:id', (req, res) => {
  res.json({ message: 'Get VPN key info endpoint - TODO' });
});

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
router.delete('/keys/:id', (req, res) => {
  res.json({ message: 'Delete VPN key endpoint - TODO' });
});

export default router;