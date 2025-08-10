import { prisma } from '../utils/prisma'
import { BalanceTransactionModel } from '../models/BalanceTransaction'
import { SettingModel } from '../models/Setting'
import { vpnService } from './vpnService'
import { VpnKeyModel } from '../models/VpnKey'
import { SubscriptionType, SubscriptionStatus, BalanceTransactionType } from '@prisma/client'

export interface BillingProcessResult {
  processedUsers: number
  chargedUsers: number
  blockedUsers: number
  unblockedUsers: number
  totalCharged: number
  errors: string[]
}

export interface UserBillingInfo {
  id: number
  name: string
  email: string
  subscriptionType: SubscriptionType
  balance: number
  subscriptionStatus: SubscriptionStatus
  subscriptionStartDate?: Date
  nextBillingDate?: Date
  remainingDays?: number
  canAffordNextMonth: boolean
}

export class BillingService {
  
  /**
   * Main billing process - charges users and updates traffic limits
   */
  async processBilling(): Promise<BillingProcessResult> {
    const result: BillingProcessResult = {
      processedUsers: 0,
      chargedUsers: 0,
      blockedUsers: 0,
      unblockedUsers: 0,
      totalCharged: 0,
      errors: []
    }

    try {
      const monthlyCost = await SettingModel.getBillingMonthlyCost()
      
      // Get all paid users
      const paidUsers = await prisma.user.findMany({
        where: { subscriptionType: 'PAID' }
      })

      result.processedUsers = paidUsers.length

      for (const user of paidUsers) {
        try {
          // Check if billing date has arrived
          if (user.nextBillingDate && new Date() >= user.nextBillingDate) {
            // Charge the user
            const newBalance = user.balance - monthlyCost
            
            await prisma.user.update({
              where: { id: user.id },
              data: {
                balance: newBalance,
                subscriptionStartDate: user.nextBillingDate,
                nextBillingDate: new Date(user.nextBillingDate.getTime() + 30 * 24 * 60 * 60 * 1000), // +30 days
              }
            })

            // Create transaction record
            await BalanceTransactionModel.create({
              userId: user.id,
              amount: -monthlyCost,
              type: 'MONTHLY_CHARGE',
              description: `Monthly subscription charge - ${monthlyCost} points`
            })

            result.chargedUsers++
            result.totalCharged += monthlyCost
          }

          // Update subscription status and traffic limits
          const updatedUser = await prisma.user.findUnique({ where: { id: user.id } })
          if (updatedUser) {
            await this.updateUserSubscriptionStatus(updatedUser, result)
          }

        } catch (error) {
          result.errors.push(`Error processing user ${user.id}: ${error}`)
        }
      }

      console.log('Billing process completed:', result)
      return result

    } catch (error) {
      result.errors.push(`Billing process failed: ${error}`)
      throw error
    }
  }

  /**
   * Update user subscription status and traffic limits based on balance
   */
  private async updateUserSubscriptionStatus(user: any, result: BillingProcessResult) {
    const monthlyCost = await SettingModel.getBillingMonthlyCost()
    const canAfford = user.balance >= monthlyCost
    const wasActive = user.subscriptionStatus === 'ACTIVE'

    if (canAfford && !wasActive) {
      // User can afford - activate subscription and restore traffic limits
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'ACTIVE' }
      })
      await this.restoreUserTrafficLimits(user.id)
      result.unblockedUsers++
    } else if (!canAfford && wasActive) {
      // User cannot afford - block subscription and set traffic limits to 0
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'INSUFFICIENT_BALANCE' }
      })
      await this.blockUserTrafficLimits(user.id)
      result.blockedUsers++
    }
  }

  /**
   * Block user by setting all their VPN key traffic limits to 0
   */
  private async blockUserTrafficLimits(userId: number) {
    const userKeys = await VpnKeyModel.findByUserId(userId)
    
    for (const key of userKeys) {
      try {
        await vpnService.setKeyDataLimit(key.outlineKeyId, 0)
      } catch (error) {
        console.error(`Failed to block traffic for key ${key.outlineKeyId}:`, error)
      }
    }
  }

  /**
   * Restore user traffic limits to default server limits
   */
  private async restoreUserTrafficLimits(userId: number) {
    const userKeys = await VpnKeyModel.findByUserId(userId)
    const serverInfo = await vpnService.getServerInfo()
    const defaultLimit = serverInfo.accessKeyDataLimit?.bytes
    
    for (const key of userKeys) {
      try {
        if (defaultLimit) {
          await vpnService.setKeyDataLimit(key.outlineKeyId, defaultLimit)
        } else {
          // If no default limit, remove the limit entirely
          await vpnService.deleteKeyDataLimit(key.outlineKeyId)
        }
      } catch (error) {
        console.error(`Failed to restore traffic for key ${key.outlineKeyId}:`, error)
      }
    }
  }

  /**
   * Add balance to user account
   */
  async addBalance(userId: number, amount: number, performedBy: number, description?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      // Update user balance
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: {
            increment: amount
          }
        }
      })

      // Create transaction record
      const transactionType = amount > 0 ? 'PAYMENT' : 'ADMIN_ADJUSTMENT'
      await tx.balanceTransaction.create({
        data: {
          userId,
          amount,
          type: transactionType,
          description: description || (amount > 0 ? `Balance top-up: +${amount} points` : `Balance deduction: ${amount} points`),
          performedBy,
        }
      })
    })

    // Check if user should be unblocked/blocked
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user && user.subscriptionType === 'PAID') {
      const result: BillingProcessResult = {
        processedUsers: 0,
        chargedUsers: 0,
        blockedUsers: 0,
        unblockedUsers: 0,
        totalCharged: 0,
        errors: []
      }
      await this.updateUserSubscriptionStatus(user, result)
    }
  }

  /**
   * Set user balance to specific amount
   */
  async setBalance(userId: number, newBalance: number, performedBy: number, description?: string): Promise<void> {
    const currentUser = await prisma.user.findUnique({ where: { id: userId } })
    if (!currentUser) {
      throw new Error('User not found')
    }

    const balanceDifference = newBalance - currentUser.balance

    await prisma.$transaction(async (tx) => {
      // Update user balance to specific amount
      await tx.user.update({
        where: { id: userId },
        data: {
          balance: newBalance
        }
      })

      // Create transaction record
      await tx.balanceTransaction.create({
        data: {
          userId,
          amount: balanceDifference,
          type: 'ADMIN_ADJUSTMENT',
          description: description || `Balance set to ${newBalance} points (change: ${balanceDifference >= 0 ? '+' : ''}${balanceDifference})`,
          performedBy,
        }
      })
    })

    // Check if user should be unblocked/blocked
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user && user.subscriptionType === 'PAID') {
      const result: BillingProcessResult = {
        processedUsers: 0,
        chargedUsers: 0,
        blockedUsers: 0,
        unblockedUsers: 0,
        totalCharged: 0,
        errors: []
      }
      await this.updateUserSubscriptionStatus(user, result)
    }
  }

  /**
   * Start paid subscription for a user
   */
  async startPaidSubscription(userId: number, performedBy: number): Promise<void> {
    const now = new Date()
    const nextBilling = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 days

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionType: 'PAID',
        subscriptionStartDate: now,
        nextBillingDate: nextBilling,
        subscriptionStatus: 'ACTIVE'
      }
    })

    await BalanceTransactionModel.create({
      userId,
      amount: 0,
      type: 'ADMIN_ADJUSTMENT',
      description: 'Started paid subscription',
      performedBy,
    })
  }

  /**
   * Get billing information for a user
   */
  async getUserBillingInfo(userId: number): Promise<UserBillingInfo> {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      throw new Error('User not found')
    }

    const monthlyCost = await SettingModel.getBillingMonthlyCost()
    let remainingDays: number | undefined

    if (user.subscriptionType === 'PAID' && user.balance > 0) {
      const monthsRemaining = user.balance / monthlyCost
      remainingDays = Math.floor(monthsRemaining * 30)
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      subscriptionType: user.subscriptionType,
      balance: user.balance,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate || undefined,
      nextBillingDate: user.nextBillingDate || undefined,
      remainingDays,
      canAffordNextMonth: user.balance >= monthlyCost
    }
  }

  /**
   * Get all users with billing information
   */
  async getAllUsersBillingInfo(): Promise<UserBillingInfo[]> {
    const users = await prisma.user.findMany({
      orderBy: { name: 'asc' }
    })

    return Promise.all(
      users.map(user => this.getUserBillingInfo(user.id))
    )
  }
}

export const billingService = new BillingService()