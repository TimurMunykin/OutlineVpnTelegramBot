import { Request, Response } from 'express';
import { InviteTokenModel } from '../models/InviteToken';
import { VpnClientModel } from '../models/VpnClient';
import { UserModel } from '../models/User';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

interface CreateInviteRequest extends AuthenticatedRequest {
  body: {
    vpnClientId: number;
    email?: string;
    expiresInDays?: number;
  };
}

interface UseInviteRequest extends Request {
  body: {
    token: string;
    email: string;
    name: string;
    password: string;
  };
}

interface ValidateInviteRequest extends Request {
  params: {
    token: string;
  };
}

export class InviteController {
  static async createInvite(req: CreateInviteRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут создавать инвайты
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { vpnClientId, email, expiresInDays = 7 } = req.body;

      if (!vpnClientId) {
        return res.status(400).json({
          error: 'VPN client ID is required',
        });
      }

      // Проверяем, что VPN клиент существует
      const vpnClient = await VpnClientModel.findById(vpnClientId);
      if (!vpnClient) {
        return res.status(404).json({ error: 'VPN client not found' });
      }

      // Проверяем, что клиент еще не мигрирован
      if (vpnClient.migratedToUserId) {
        return res.status(400).json({
          error: 'VPN client is already migrated to a user account',
        });
      }

      const invite = await InviteTokenModel.create({
        vpnClientId,
        email: email?.trim(),
        expiresInDays,
      });

      res.status(201).json({
        message: 'Invite created successfully',
        invite: {
          id: invite.id,
          token: invite.token,
          email: invite.email,
          expiresAt: invite.expiresAt,
          inviteUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/invite/${invite.token}`,
        },
      });
    } catch (error) {
      console.error('Error creating invite:', error);
      res.status(500).json({ error: 'Failed to create invite' });
    }
  }

  static async validateInvite(req: ValidateInviteRequest, res: Response) {
    try {
      const { token } = req.params;

      const invite = await InviteTokenModel.findByToken(token);
      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.isUsed) {
        return res.status(400).json({ error: 'Invite has already been used' });
      }

      if (invite.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invite has expired' });
      }

      res.json({
        valid: true,
        invite: {
          id: invite.id,
          email: invite.email,
          vpnClient: {
            id: invite.vpnClient.id,
            name: invite.vpnClient.name,
            vpnKeysCount: invite.vpnClient.vpnKeys?.length || 0,
          },
          expiresAt: invite.expiresAt,
        },
      });
    } catch (error) {
      console.error('Error validating invite:', error);
      res.status(500).json({ error: 'Failed to validate invite' });
    }
  }

  static async useInvite(req: UseInviteRequest, res: Response) {
    try {
      const { token, email, name, password } = req.body;

      if (!token || !email || !name || !password) {
        return res.status(400).json({
          error: 'Token, email, name and password are required',
        });
      }

      if (password.length < 6) {
        return res.status(400).json({
          error: 'Password must be at least 6 characters long',
        });
      }

      // Проверяем валидность инвайта
      const invite = await InviteTokenModel.findByToken(token);
      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.isUsed) {
        return res.status(400).json({ error: 'Invite has already been used' });
      }

      if (invite.expiresAt < new Date()) {
        return res.status(400).json({ error: 'Invite has expired' });
      }

      // Проверяем, что email уникален
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          error: 'User with this email already exists',
        });
      }

      // Используем транзакцию для атомарности операции
      const result = await prisma.$transaction(async (tx) => {
        // Создаем пользователя
        const user = await UserModel.create({
          email: email.trim(),
          name: name.trim(),
          password,
          role: 'USER',
          isEmailVerified: true, // Считаем пользователя верифицированным через инвайт
          hasWebAccess: true,
        });

        // Переносим VPN ключи с клиента на пользователя
        await tx.vpnKey.updateMany({
          where: { vpnClientId: invite.vpnClientId },
          data: {
            userId: user.id,
            vpnClientId: null,
          },
        });

        // Помечаем VPN клиента как мигрированного
        await VpnClientModel.markAsMigrated(invite.vpnClientId, user.id);

        // Помечаем инвайт как использованный
        await InviteTokenModel.markAsUsed(invite.id, user.id);

        return user;
      });

      const { password: _, passwordHash: __, ...userWithoutPassword } = result;

      res.status(201).json({
        message: 'Registration completed successfully. Your VPN access has been migrated to your account.',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error using invite:', error);
      res.status(500).json({ error: 'Failed to complete registration' });
    }
  }

  static async getInvites(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать все инвайты
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const invites = await prisma.inviteToken.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          vpnClient: {
            select: {
              id: true,
              name: true,
            },
          },
          usedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      res.json({
        invites,
      });
    } catch (error) {
      console.error('Error fetching invites:', error);
      res.status(500).json({ error: 'Failed to fetch invites' });
    }
  }

  static async deleteInvite(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут удалять инвайты
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { id } = req.params;

      const invite = await InviteTokenModel.findById(id);
      if (!invite) {
        return res.status(404).json({ error: 'Invite not found' });
      }

      if (invite.isUsed) {
        return res.status(400).json({
          error: 'Cannot delete used invite',
        });
      }

      await InviteTokenModel.delete(id);

      res.json({
        message: 'Invite deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting invite:', error);
      res.status(500).json({ error: 'Failed to delete invite' });
    }
  }

  static async getInviteStats(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать статистику
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const stats = await InviteTokenModel.getStats();

      res.json({
        stats,
      });
    } catch (error) {
      console.error('Error fetching invite stats:', error);
      res.status(500).json({ error: 'Failed to fetch invite statistics' });
    }
  }
}