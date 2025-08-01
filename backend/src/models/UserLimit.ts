import { prisma } from '../utils/prisma'
import { UserLimit } from '@prisma/client'
import { SettingModel } from './Setting'

export interface ICreateUserLimit {
  userId: number
  maxVpnKeys?: number
  canCreateKeys?: boolean
  notes?: string
}

export interface IUpdateUserLimit {
  maxVpnKeys?: number
  canCreateKeys?: boolean
  notes?: string
}

export class UserLimitModel {
  static async create(data: ICreateUserLimit): Promise<UserLimit> {
    return prisma.userLimit.create({
      data: {
        userId: data.userId,
        maxVpnKeys: data.maxVpnKeys,
        canCreateKeys: data.canCreateKeys ?? true,
        notes: data.notes
      }
    })
  }

  static async findByUserId(userId: number): Promise<UserLimit | null> {
    return prisma.userLimit.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      }
    })
  }

  static async findAll(): Promise<UserLimit[]> {
    return prisma.userLimit.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async update(userId: number, data: IUpdateUserLimit): Promise<UserLimit> {
    return prisma.userLimit.upsert({
      where: { userId },
      update: {
        ...data,
        updatedAt: new Date()
      },
      create: {
        userId,
        maxVpnKeys: data.maxVpnKeys,
        canCreateKeys: data.canCreateKeys ?? true,
        notes: data.notes
      }
    })
  }

  static async delete(userId: number): Promise<void> {
    await prisma.userLimit.delete({
      where: { userId }
    })
  }

  // Get effective limits for a user (individual override or global default)
  static async getEffectiveLimits(userId: number): Promise<{
    maxVpnKeys: number
    canCreateKeys: boolean
    isOverridden: boolean
  }> {
    const userLimit = await this.findByUserId(userId)
    
    if (userLimit) {
      return {
        maxVpnKeys: userLimit.maxVpnKeys ?? await SettingModel.getDefaultMaxKeysPerUser(),
        canCreateKeys: userLimit.canCreateKeys,
        isOverridden: true
      }
    }

    // Use global defaults
    return {
      maxVpnKeys: await SettingModel.getDefaultMaxKeysPerUser(),
      canCreateKeys: await SettingModel.isUserKeyCreationAllowed(),
      isOverridden: false
    }
  }

  // Check if user can create more keys
  static async canUserCreateKey(userId: number): Promise<{
    canCreate: boolean
    reason?: string
    currentCount: number
    maxAllowed: number
  }> {
    const limits = await this.getEffectiveLimits(userId)
    
    // Count current user's keys first - we need this in both cases
    const currentCount = await prisma.vpnKey.count({
      where: { userId }
    })
    
    if (!limits.canCreateKeys) {
      return {
        canCreate: false,
        reason: 'Key creation disabled for this user',
        currentCount,
        maxAllowed: limits.maxVpnKeys
      }
    }

    if (currentCount >= limits.maxVpnKeys) {
      return {
        canCreate: false,
        reason: `Maximum ${limits.maxVpnKeys} keys allowed`,
        currentCount,
        maxAllowed: limits.maxVpnKeys
      }
    }

    return {
      canCreate: true,
      currentCount,
      maxAllowed: limits.maxVpnKeys
    }
  }

  static async getUsersWithLimits(): Promise<Array<{
    id: number
    name: string
    email: string
    role: string
    currentKeyCount: number
    maxVpnKeys: number
    canCreateKeys: boolean
    isOverridden: boolean
  }>> {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        userLimit: true,
        _count: {
          select: {
            vpnKeys: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    const defaultMaxKeys = await SettingModel.getDefaultMaxKeysPerUser()
    const defaultCanCreate = await SettingModel.isUserKeyCreationAllowed()

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      currentKeyCount: user._count.vpnKeys,
      maxVpnKeys: user.userLimit?.maxVpnKeys ?? defaultMaxKeys,
      canCreateKeys: user.userLimit?.canCreateKeys ?? defaultCanCreate,
      isOverridden: !!user.userLimit
    }))
  }
}