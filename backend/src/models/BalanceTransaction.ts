import { prisma } from '../utils/prisma'
import { BalanceTransactionType } from '@prisma/client'

export interface CreateTransactionParams {
  userId: number
  amount: number
  type: BalanceTransactionType
  description: string
  performedBy?: number
}

export class BalanceTransactionModel {
  static async create(params: CreateTransactionParams) {
    return prisma.balanceTransaction.create({
      data: {
        userId: params.userId,
        amount: params.amount,
        type: params.type,
        description: params.description,
        performedBy: params.performedBy,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        performedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    })
  }

  static async findByUserId(userId: number, limit: number = 50) {
    return prisma.balanceTransaction.findMany({
      where: { userId },
      include: {
        performedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  static async findAll(limit: number = 100) {
    return prisma.balanceTransaction.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        performedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  static async findByType(type: BalanceTransactionType, limit: number = 50) {
    return prisma.balanceTransaction.findMany({
      where: { type },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        performedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  static async getTotalByUser(userId: number): Promise<number> {
    const result = await prisma.balanceTransaction.aggregate({
      where: { userId },
      _sum: { amount: true }
    })
    return result._sum.amount || 0
  }

  static async getMonthlyChargesTotal(): Promise<number> {
    const result = await prisma.balanceTransaction.aggregate({
      where: { 
        type: 'MONTHLY_CHARGE',
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        }
      },
      _sum: { amount: true }
    })
    return Math.abs(result._sum.amount || 0) // Convert to positive for display
  }
}