import { Request, Response } from 'express'
import { billingService } from '../services/BillingService'
import { BalanceTransactionModel } from '../models/BalanceTransaction'
import { SettingModel } from '../models/Setting'
import { cronService } from '../services/CronService'

export class BillingController {
  
  /**
   * Get billing information for current user
   */
  static async getUserBilling(req: Request, res: Response): Promise<Response> {
    try {
      const billingInfo = await billingService.getUserBillingInfo(req.user!.id)
      const monthlyCost = await SettingModel.getBillingMonthlyCost()
      const currencyName = await SettingModel.getBillingCurrencyName()
      
      return res.json({
        billing: billingInfo,
        settings: {
          monthlyCost,
          currencyName
        }
      })
    } catch (error) {
      console.error('Error fetching user billing info:', error)
      return res.status(500).json({ error: 'Failed to fetch billing information' })
    }
  }

  /**
   * Get user's balance transaction history
   */
  static async getUserTransactions(req: Request, res: Response): Promise<Response> {
    try {
      const limit = parseInt(req.query.limit as string) || 50
      const transactions = await BalanceTransactionModel.findByUserId(req.user!.id, limit)
      
      return res.json({ transactions })
    } catch (error) {
      console.error('Error fetching user transactions:', error)
      return res.status(500).json({ error: 'Failed to fetch transaction history' })
    }
  }

  /**
   * ADMIN: Get all users with billing information
   */
  static async getAllUsersBilling(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const users = await billingService.getAllUsersBillingInfo()
      const monthlyCost = await SettingModel.getBillingMonthlyCost()
      const currencyName = await SettingModel.getBillingCurrencyName()
      
      return res.json({
        users,
        settings: {
          monthlyCost,
          currencyName
        }
      })
    } catch (error) {
      console.error('Error fetching all users billing info:', error)
      return res.status(500).json({ error: 'Failed to fetch billing information' })
    }
  }

  /**
   * ADMIN: Add balance to user account
   */  
  static async addUserBalance(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const userId = parseInt(req.params.userId)
      const { amount, description } = req.body

      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid userId and positive amount required' })
      }

      await billingService.addBalance(
        userId, 
        amount, 
        req.user!.id, 
        description || `Balance top-up by admin: +${amount} points`
      )

      const updatedUser = await billingService.getUserBillingInfo(userId)
      return res.json({ 
        message: 'Balance added successfully',
        user: updatedUser
      })
    } catch (error) {
      console.error('Error adding user balance:', error)
      return res.status(500).json({ error: 'Failed to add balance' })
    }
  }

  /**
   * ADMIN: Set user balance to specific amount
   */
  static async setUserBalance(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const userId = parseInt(req.params.userId)
      const { balance, description } = req.body

      if (!userId || balance === undefined || balance < 0) {
        return res.status(400).json({ error: 'Valid userId and non-negative balance required' })
      }

      await billingService.setBalance(
        userId, 
        balance, 
        req.user!.id, 
        description || `Balance set to ${balance} points by admin`
      )

      const updatedUser = await billingService.getUserBillingInfo(userId)
      return res.json({ 
        message: 'Balance set successfully',
        user: updatedUser
      })
    } catch (error) {
      console.error('Error setting user balance:', error)
      return res.status(500).json({ error: 'Failed to set balance' })
    }
  }

  /**
   * ADMIN: Deduct balance from user account
   */
  static async deductUserBalance(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const userId = parseInt(req.params.userId)
      const { amount, description } = req.body

      if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid userId and positive amount required' })
      }

      await billingService.addBalance(
        userId, 
        -amount, 
        req.user!.id, 
        description || `Balance deduction by admin: -${amount} points`
      )

      const updatedUser = await billingService.getUserBillingInfo(userId)
      return res.json({ 
        message: 'Balance deducted successfully',
        user: updatedUser
      })
    } catch (error) {
      console.error('Error deducting user balance:', error)
      return res.status(500).json({ error: 'Failed to deduct balance' })
    }
  }

  /**
   * ADMIN: Start paid subscription for user
   */
  static async startPaidSubscription(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const userId = parseInt(req.params.userId)
      if (!userId) {
        return res.status(400).json({ error: 'Valid userId required' })
      }

      await billingService.startPaidSubscription(userId, req.user!.id)
      
      const updatedUser = await billingService.getUserBillingInfo(userId)
      return res.json({ 
        message: 'Paid subscription started',
        user: updatedUser
      })
    } catch (error) {
      console.error('Error starting paid subscription:', error)
      return res.status(500).json({ error: 'Failed to start paid subscription' })
    }
  }

  /**
   * ADMIN: Process billing (manual trigger)
   */
  static async processBilling(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      console.log(`Manual billing process triggered by admin ${req.user!.id}`)
      const result = await billingService.processBilling()
      
      return res.json({
        message: 'Billing process completed',
        result
      })
    } catch (error) {
      console.error('Error processing billing:', error)
      return res.status(500).json({ 
        error: 'Failed to process billing',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }

  /**
   * ADMIN: Get all balance transactions
   */
  static async getAllTransactions(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const limit = parseInt(req.query.limit as string) || 100
      const type = req.query.type as string
      
      let transactions
      if (type) {
        transactions = await BalanceTransactionModel.findByType(type as any, limit)
      } else {
        transactions = await BalanceTransactionModel.findAll(limit)
      }
      
      return res.json({ transactions })
    } catch (error) {
      console.error('Error fetching all transactions:', error)
      return res.status(500).json({ error: 'Failed to fetch transactions' })
    }
  }

  /**
   * ADMIN: Get billing statistics
   */
  static async getBillingStats(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const monthlyChargesTotal = await BalanceTransactionModel.getMonthlyChargesTotal()
      const users = await billingService.getAllUsersBillingInfo()
      
      const stats = {
        totalUsers: users.length,
        paidUsers: users.filter(u => u.subscriptionType === 'PAID').length,
        freeUsers: users.filter(u => u.subscriptionType === 'FREE').length,
        activeUsers: users.filter(u => u.subscriptionStatus === 'ACTIVE').length,
        blockedUsers: users.filter(u => u.subscriptionStatus === 'INSUFFICIENT_BALANCE').length,
        totalBalance: users.reduce((sum, u) => sum + u.balance, 0),
        monthlyRevenue: monthlyChargesTotal,
        usersWithLowBalance: users.filter(u => u.subscriptionType === 'PAID' && !u.canAffordNextMonth).length
      }
      
      return res.json({ stats })
    } catch (error) {
      console.error('Error fetching billing stats:', error)
      return res.status(500).json({ error: 'Failed to fetch billing statistics' })
    }
  }

  /**
   * ADMIN: Get cron job status
   */
  static async getCronStatus(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      const status = cronService.getBillingJobStatus()
      return res.json({ status })
    } catch (error) {
      console.error('Error fetching cron status:', error)
      return res.status(500).json({ error: 'Failed to fetch cron status' })
    }
  }

  /**
   * ADMIN: Manually trigger billing process
   */
  static async triggerBillingManually(req: Request, res: Response): Promise<Response> {
    try {
      if (req.user!.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' })
      }

      console.log(`Manual billing trigger by admin ${req.user!.id}`)
      const result = await cronService.triggerBillingManually()
      
      return res.json({
        message: 'Manual billing process completed',
        result
      })
    } catch (error) {
      console.error('Error in manual billing trigger:', error)
      return res.status(500).json({ 
        error: 'Failed to trigger billing manually',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}