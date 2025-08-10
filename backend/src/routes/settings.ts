import { Router } from 'express';
import { SettingsController } from '../controllers/SettingsController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/settings:
 *   get:
 *     summary: Get all settings (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of settings
 */
router.get('/', authenticateToken, requireAdmin, SettingsController.getSettings);

/**
 * @swagger
 * /api/settings:
 *   put:
 *     summary: Update a setting (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - key
 *               - value
 *             properties:
 *               key:
 *                 type: string
 *               value:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Setting updated successfully
 */
router.put('/', authenticateToken, requireAdmin, SettingsController.updateSetting);

/**
 * @swagger
 * /api/settings/initialize:
 *   post:
 *     summary: Initialize default settings (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Default settings initialized
 */
router.post('/initialize', authenticateToken, requireAdmin, SettingsController.initializeSettings);

/**
 * @swagger
 * /api/settings/user-limits:
 *   get:
 *     summary: Get user limits (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users with their limits
 */
router.get('/user-limits', authenticateToken, requireAdmin, SettingsController.getUserLimits);

/**
 * @swagger
 * /api/settings/user-limits/{userId}:
 *   put:
 *     summary: Update user limits (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
 *               maxVpnKeys:
 *                 type: number
 *               canCreateKeys:
 *                 type: boolean
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: User limit updated successfully
 */
router.put('/user-limits/:userId', authenticateToken, requireAdmin, SettingsController.updateUserLimit);

/**
 * @swagger
 * /api/settings/user-limits/{userId}:
 *   delete:
 *     summary: Delete user limits (admin only)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User limit removed successfully
 */
router.delete('/user-limits/:userId', authenticateToken, requireAdmin, SettingsController.deleteUserLimit);

export default router;