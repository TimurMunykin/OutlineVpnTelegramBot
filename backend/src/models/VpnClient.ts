import { prisma } from '../utils/prisma'
import { VpnClient, MigrationStatus } from '@prisma/client'

export interface ICreateVpnClient {
  name: string
  phone?: string
  telegramId?: string
  notes?: string
  migrationStatus?: MigrationStatus
  createdBy: number
}

export interface IUpdateVpnClient {
  name?: string
  phone?: string
  telegramId?: string
  notes?: string
  migrationStatus?: MigrationStatus
}

export class VpnClientModel {
  static async create(data: ICreateVpnClient): Promise<VpnClient> {
    return prisma.vpnClient.create({
      data: {
        name: data.name,
        phone: data.phone,
        telegramId: data.telegramId,
        notes: data.notes,
        migrationStatus: data.migrationStatus,
        createdBy: data.createdBy,
      },
    })
  }

  static async findById(id: number): Promise<VpnClient | null> {
    return prisma.vpnClient.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        migratedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vpnKeys: {
          select: {
            id: true,
            name: true,
            outlineKeyId: true,
            createdAt: true,
          },
        },
        inviteTokens: {
          where: {
            isUsed: false,
            expiresAt: {
              gt: new Date(),
            },
          },
          select: {
            id: true,
            token: true,
            email: true,
            expiresAt: true,
          },
        },
        _count: {
          select: {
            vpnKeys: true,
            inviteTokens: true,
          },
        },
      },
    })
  }

  static async findAll(limit = 50, offset = 0): Promise<VpnClient[]> {
    return prisma.vpnClient.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        migratedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            vpnKeys: true,
            inviteTokens: true,
          },
        },
      },
    })
  }

  static async update(id: number, data: IUpdateVpnClient): Promise<VpnClient> {
    return prisma.vpnClient.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  }

  static async delete(id: number): Promise<void> {
    await prisma.vpnClient.delete({
      where: { id },
    })
  }

  static async getStats() {
    const clients = await prisma.vpnClient.findMany({
      include: {
        _count: {
          select: {
            vpnKeys: true,
          },
        },
      },
    })

    const total = clients.length
    const withKeys = clients.filter(client => client._count.vpnKeys > 0).length
    const migrated = clients.filter(client => client.migratedToUserId !== null).length
    
    const statusCounts = clients.reduce((acc: any, client) => {
      const status = client.migrationStatus || 'NONE'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    return {
      total,
      withKeys,
      migrated,
      pending: statusCounts.PENDING || 0,
      inProgress: statusCounts.IN_PROGRESS || 0,
      completed: statusCounts.COMPLETED || 0,
    }
  }

  static async markAsMigrated(id: number, userId: number): Promise<VpnClient> {
    return prisma.vpnClient.update({
      where: { id },
      data: {
        migrationStatus: MigrationStatus.COMPLETED,
        migratedToUserId: userId,
        updatedAt: new Date(),
      },
    })
  }
}