import { prisma } from '@/utils/prisma'
import { createError } from '@/middleware/errorHandler'
import { 
  OAuthClient, 
  OAuthAuthorizationCode, 
  OAuthAccessToken, 
  OAuthRefreshToken 
} from '@prisma/client'
import { v4 as uuidv4 } from 'uuid'

export interface ICreateOAuthClient {
  name: string
  description?: string
  redirectUris: string[]
  scopes?: string[]
  userId: number
  isTrusted?: boolean
}

export class OAuthModel {
  // OAuth Clients
  static async createClient(clientData: ICreateOAuthClient): Promise<OAuthClient> {
    const { name, description, redirectUris, scopes = ['read'], userId, isTrusted = false } = clientData
    
    const clientId = uuidv4()
    const clientSecret = uuidv4()

    return prisma.oAuthClient.create({
      data: {
        clientId,
        clientSecret,
        name,
        description,
        redirectUris,
        scopes,
        userId,
        isTrusted,
      },
    })
  }

  static async findClientById(clientId: string): Promise<OAuthClient | null> {
    return prisma.oAuthClient.findUnique({
      where: { clientId },
    })
  }

  static async findClientsByUserId(userId: number): Promise<OAuthClient[]> {
    return prisma.oAuthClient.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })
  }

  static async updateClient(id: number, updates: Partial<OAuthClient>): Promise<OAuthClient> {
    try {
      return await prisma.oAuthClient.update({
        where: { id },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw createError('OAuth client not found', 404)
      }
      throw error
    }
  }

  static async deleteClient(id: number): Promise<void> {
    try {
      await prisma.oAuthClient.delete({
        where: { id },
      })
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw createError('OAuth client not found', 404)
      }
      throw error
    }
  }

  // Authorization Codes
  static async createAuthorizationCode(data: {
    clientId: string
    userId: number
    redirectUri: string
    scopes: string[]
    expiresAt: Date
  }): Promise<OAuthAuthorizationCode> {
    const code = uuidv4()

    return prisma.oAuthAuthorizationCode.create({
      data: {
        code,
        clientId: data.clientId,
        userId: data.userId,
        redirectUri: data.redirectUri,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
      },
    })
  }

  static async findAuthorizationCode(code: string): Promise<OAuthAuthorizationCode | null> {
    return prisma.oAuthAuthorizationCode.findUnique({
      where: { code },
    })
  }

  static async deleteAuthorizationCode(code: string): Promise<void> {
    await prisma.oAuthAuthorizationCode.delete({
      where: { code },
    })
  }

  // Access Tokens
  static async createAccessToken(data: {
    clientId: string
    userId: number
    scopes: string[]
    expiresAt: Date
  }): Promise<OAuthAccessToken> {
    const token = uuidv4()

    return prisma.oAuthAccessToken.create({
      data: {
        token,
        clientId: data.clientId,
        userId: data.userId,
        scopes: data.scopes,
        expiresAt: data.expiresAt,
      },
    })
  }

  static async findAccessToken(token: string): Promise<OAuthAccessToken | null> {
    return prisma.oAuthAccessToken.findUnique({
      where: { token },
    })
  }

  static async findAccessTokenWithClient(token: string) {
    return prisma.oAuthAccessToken.findUnique({
      where: { token },
      include: {
        client: true,
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

  static async deleteAccessToken(token: string): Promise<void> {
    await prisma.oAuthAccessToken.delete({
      where: { token },
    })
  }

  // Refresh Tokens
  static async createRefreshToken(data: {
    accessTokenId: number
    expiresAt: Date
  }): Promise<OAuthRefreshToken> {
    const token = uuidv4()

    return prisma.oAuthRefreshToken.create({
      data: {
        token,
        accessTokenId: data.accessTokenId,
        expiresAt: data.expiresAt,
      },
    })
  }

  static async findRefreshToken(token: string): Promise<OAuthRefreshToken | null> {
    return prisma.oAuthRefreshToken.findUnique({
      where: { token },
    })
  }

  static async deleteRefreshToken(token: string): Promise<void> {
    await prisma.oAuthRefreshToken.delete({
      where: { token },
    })
  }

  // Cleanup expired tokens
  static async cleanupExpiredTokens(): Promise<void> {
    const now = new Date()

    await Promise.all([
      prisma.oAuthAuthorizationCode.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.oAuthAccessToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      }),
      prisma.oAuthRefreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: now,
          },
        },
      }),
    ])
  }
}