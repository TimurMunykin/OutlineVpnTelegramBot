import { Router } from 'express'
import { BillingController } from '../controllers/BillingController'
import { authenticateToken, requireUser, requireAdmin } from '../middleware/auth'

const router = Router()

/**
 * @swagger
 * /api/billing/user:
 *   get:
 *     summary: Get current user's billing information
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User billing information
 */
router.get('/user', authenticateToken, requireUser, BillingController.getUserBilling)

/**
 * @swagger
 * /api/billing/user/transactions:
 *   get:
 *     summary: Get current user's transaction history
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: User transaction history
 */
router.get('/user/transactions', authenticateToken, requireUser, BillingController.getUserTransactions)

/**
 * @swagger
 * /api/billing/admin/users:
 *   get:
 *     summary: Get all users billing information (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users billing information
 */
router.get('/admin/users', authenticateToken, requireAdmin, BillingController.getAllUsersBilling)

/**
 * @swagger
 * /api/billing/admin/users/{userId}/balance:
 *   post:
 *     summary: Add balance to user account (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount to add (positive number)
 *               description:
 *                 type: string
 *                 description: Optional description for the transaction
 *     responses:
 *       200:
 *         description: Balance added successfully
 */
router.post('/admin/users/:userId/balance', authenticateToken, requireAdmin, BillingController.addUserBalance)

/**
 * @swagger
 * /api/billing/admin/users/{userId}/balance/set:
 *   post:
 *     summary: Set user balance to specific amount (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               balance:
 *                 type: integer
 *                 description: New balance amount (non-negative)
 *               description:
 *                 type: string
 *                 description: Optional description for the transaction
 *     responses:
 *       200:
 *         description: Balance set successfully
 */
router.post('/admin/users/:userId/balance/set', authenticateToken, requireAdmin, BillingController.setUserBalance)

/**
 * @swagger
 * /api/billing/admin/users/{userId}/balance/deduct:
 *   post:
 *     summary: Deduct balance from user account (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: integer
 *                 description: Amount to deduct (positive number)
 *               description:
 *                 type: string
 *                 description: Optional description for the transaction
 *     responses:
 *       200:
 *         description: Balance deducted successfully
 */
router.post('/admin/users/:userId/balance/deduct', authenticateToken, requireAdmin, BillingController.deductUserBalance)

/**
 * @swagger
 * /api/billing/admin/users/{userId}/start-paid:
 *   post:
 *     summary: Start paid subscription for user (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paid subscription started
 */
router.post('/admin/users/:userId/start-paid', authenticateToken, requireAdmin, BillingController.startPaidSubscription)

/**
 * @swagger
 * /api/billing/admin/process:
 *   post:
 *     summary: Manually trigger billing process (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing process completed
 */
router.post('/admin/process', authenticateToken, requireAdmin, BillingController.processBilling)

/**
 * @swagger
 * /api/billing/admin/transactions:
 *   get:
 *     summary: Get all balance transactions (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [PAYMENT, MONTHLY_CHARGE, ADMIN_ADJUSTMENT]
 *     responses:
 *       200:
 *         description: All balance transactions
 */
router.get('/admin/transactions', authenticateToken, requireAdmin, BillingController.getAllTransactions)

/**
 * @swagger
 * /api/billing/admin/stats:
 *   get:
 *     summary: Get billing statistics (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Billing statistics
 */
router.get('/admin/stats', authenticateToken, requireAdmin, BillingController.getBillingStats)

/**
 * @swagger
 * /api/billing/admin/cron/status:
 *   get:
 *     summary: Get cron job status (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cron job status
 */
router.get('/admin/cron/status', authenticateToken, requireAdmin, BillingController.getCronStatus)

/**
 * @swagger
 * /api/billing/admin/cron/trigger:
 *   post:
 *     summary: Manually trigger billing process (Admin only)
 *     tags: [Billing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manual billing trigger completed
 */
router.post('/admin/cron/trigger', authenticateToken, requireAdmin, BillingController.triggerBillingManually)

export default router