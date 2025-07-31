import bcrypt from 'bcrypt'
import { prisma } from '../utils/prisma'
import { User, UserRole } from '@prisma/client'

export interface ICreateUser {
  email: string
  name: string
  password: string
  role?: UserRole
  isEmailVerified?: boolean
}

export class UserModel {
  static async create(userData: ICreateUser): Promise<User & { password: string }> {
    const { email, name, password, role = UserRole.USER, isEmailVerified = false } = userData

    const saltRounds = 10
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        isEmailVerified,
      },
    })

    return { ...user, password: passwordHash }
  }

  static async findById(id: number): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  static async findByEmailWithPassword(email: string): Promise<(User & { password: string }) | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    })
    
    if (!user) return null
    
    return { ...user, password: user.passwordHash }
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  static async updatePassword(userId: number, newPassword: string): Promise<User> {
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(newPassword, saltRounds)
    
    return prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    })
  }

  static async verifyEmail(userId: number): Promise<User> {
    return prisma.user.update({
      where: { id: userId },
      data: {
        isEmailVerified: true,
        updatedAt: new Date(),
      },
    })
  }

  static async findAll(limit = 50, offset = 0): Promise<User[]> {
    return prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    })
  }

  static async updateUser(
    userId: number, 
    updates: Partial<Pick<User, 'name' | 'email' | 'role'>>
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    })

    if (!user) {
      throw new Error('User not found')
    }

    return user
  }

  static async deleteUser(userId: number): Promise<void> {
    try {
      await prisma.user.delete({
        where: { id: userId },
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new Error('User not found')
      }
      throw error
    }
  }

  static async getUserWithStats(userId: number) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        vpnKeys: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        oauthClients: {
          select: {
            id: true,
            name: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            vpnKeys: true,
            oauthClients: true,
            userSessions: true,
          },
        },
      },
    })
  }

  static async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await prisma.userSession.create({
      data: {
        userId,
        refreshToken,
        expiresAt,
      },
    })
  }

  static async verifyRefreshToken(userId: number, refreshToken: string): Promise<boolean> {
    const session = await prisma.userSession.findFirst({
      where: {
        userId,
        refreshToken,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    return !!session
  }

  static async revokeRefreshTokens(userId: number): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { userId },
    })
  }
}