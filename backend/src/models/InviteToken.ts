import { prisma } from '../utils/prisma'
import { InviteToken } from '@prisma/client'
import { randomBytes } from 'crypto'

export interface ICreateInviteToken {
  vpnClientId: number
  email?: string
  expiresInDays?: number
}

export class InviteTokenModel {
  static async create(data: ICreateInviteToken): Promise<InviteToken> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (data.expiresInDays || 7))

    // Генерируем уникальный токен
    const token = randomBytes(32).toString('hex')

    return prisma.inviteToken.create({
      data: {
        vpnClientId: data.vpnClientId,
        email: data.email,
        token,
        expiresAt,
      },
    })
  }

  static async findByToken(token: string): Promise<InviteToken | null> {
    return prisma.inviteToken.findUnique({
      where: { token },
      include: {
        vpnClient: {
          include: {
            vpnKeys: true,
          },
        },
      },
    })
  }

  static async findById(id: string): Promise<InviteToken | null> {
    return prisma.inviteToken.findUnique({
      where: { id },
      include: {
        vpnClient: true,
        usedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  static async findByVpnClient(vpnClientId: number): Promise<InviteToken[]> {
    return prisma.inviteToken.findMany({
      where: { vpnClientId },
      orderBy: { createdAt: 'desc' },
      include: {
        usedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })
  }

  static async markAsUsed(id: string, userId: number): Promise<InviteToken> {
    return prisma.inviteToken.update({
      where: { id },
      data: {
        isUsed: true,
        usedAt: new Date(),
        usedByUserId: userId,
      },
    })
  }

  static async isValid(token: string): Promise<boolean> {
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
    })

    if (!invite) return false
    if (invite.isUsed) return false
    if (invite.expiresAt < new Date()) return false

    return true
  }

  static async delete(id: string): Promise<void> {
    await prisma.inviteToken.delete({
      where: { id },
    })
  }

  static async cleanup(): Promise<number> {
    // Удаляем просроченные неиспользованные токены
    const result = await prisma.inviteToken.deleteMany({
      where: {
        AND: [
          { isUsed: false },
          { expiresAt: { lt: new Date() } },
        ],
      },
    })

    return result.count
  }

  static async getStats() {
    const tokens = await prisma.inviteToken.findMany()

    const total = tokens.length
    const used = tokens.filter(token => token.isUsed).length
    const expired = tokens.filter(token => !token.isUsed && token.expiresAt < new Date()).length
    const active = tokens.filter(token => !token.isUsed && token.expiresAt >= new Date()).length

    return {
      total,
      used,
      expired,
      active,
    }
  }
}