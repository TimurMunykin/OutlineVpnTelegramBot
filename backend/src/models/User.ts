import bcrypt from 'bcrypt'
import { prisma } from '@/utils/prisma'
import { createError } from '@/middleware/errorHandler'
import { User, UserRole } from '@prisma/client'

export interface ICreateUser {
  email: string
  name: string
  password: string
  role?: UserRole
}

export class UserModel {
  static async create(userData: ICreateUser): Promise<User> {
    const { email, name, password, role = UserRole.USER } = userData
    
    // Check if user already exists
    const existingUser = await this.findByEmail(email)
    if (existingUser) {
      throw createError('User with this email already exists', 400)
    }

    // Hash password
    const saltRounds = 12
    const passwordHash = await bcrypt.hash(password, saltRounds)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
      },
    })

    return user
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

  static async findByEmailWithPassword(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
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
      throw createError('User not found', 404)
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
        throw createError('User not found', 404)
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
}