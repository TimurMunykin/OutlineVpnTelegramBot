import { prisma } from '@/utils/prisma'
import { createError } from '@/middleware/errorHandler'
import { VpnKey } from '@prisma/client'

export interface ICreateVpnKey {
  userId: number
  outlineKeyId: string
  accessUrl: string
  name?: string
}

export class VpnKeyModel {
  static async create(keyData: ICreateVpnKey): Promise<VpnKey> {
    const { userId, outlineKeyId, accessUrl, name } = keyData
    
    return prisma.vpnKey.create({
      data: {
        userId,
        outlineKeyId,
        accessUrl,
        name,
      },
    })
  }

  static async findById(id: number): Promise<VpnKey | null> {
    return prisma.vpnKey.findUnique({
      where: { id },
    })
  }

  static async findByOutlineKeyId(outlineKeyId: string): Promise<VpnKey | null> {
    return prisma.vpnKey.findFirst({
      where: { outlineKeyId },
    })
  }

  static async findByUserId(userId: number, limit = 50, offset = 0): Promise<VpnKey[]> {
    return prisma.vpnKey.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  static async findAll(limit = 50, offset = 0): Promise<VpnKey[]> {
    return prisma.vpnKey.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  static async updateName(id: number, name: string): Promise<VpnKey> {
    try {
      return await prisma.vpnKey.update({
        where: { id },
        data: { name },
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw createError('VPN key not found', 404)
      }
      throw error
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      await prisma.vpnKey.delete({
        where: { id },
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw createError('VPN key not found', 404)
      }
      throw error
    }
  }

  static async deleteByOutlineKeyId(outlineKeyId: string): Promise<void> {
    try {
      await prisma.vpnKey.deleteMany({
        where: { outlineKeyId },
      })
    } catch (error: any) {
      throw createError('VPN key not found', 404)
    }
  }

  static async checkOwnership(keyId: number, userId: number): Promise<boolean> {
    const key = await prisma.vpnKey.findFirst({
      where: {
        id: keyId,
        userId: userId,
      },
    })
    return !!key
  }

  static async getKeyWithUser(id: number) {
    return prisma.vpnKey.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
    })
  }

  static async getStats() {
    const total = await prisma.vpnKey.count()
    
    const byUser = await prisma.vpnKey.groupBy({
      by: ['userId'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    })

    // Get user names for the grouped results
    const userIds = byUser.map(item => item.userId)
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
      },
    })

    const userMap = new Map(users.map(user => [user.id, user.name]))

    const byUserWithNames = byUser.map(item => ({
      userId: item.userId,
      userName: userMap.get(item.userId) || 'Unknown',
      count: item._count.id,
    }))

    return {
      total,
      byUser: byUserWithNames,
    }
  }

  static async findAllWithUsers(limit = 50, offset = 0) {
    return prisma.vpnKey.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }
}