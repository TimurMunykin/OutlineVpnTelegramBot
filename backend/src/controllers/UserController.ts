import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import bcrypt from 'bcrypt';

interface CreateUserRequest extends Request {
  body: {
    email: string;
    name: string;
    password: string;
    role?: 'USER' | 'ADMIN';
    hasWebAccess?: boolean;
    migrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  };
}

interface UpdateUserRequest extends Request {
  params: {
    id: string;
  };
  body: {
    email?: string;
    name?: string;
    password?: string;
    role?: 'USER' | 'ADMIN';
    hasWebAccess?: boolean;
    migrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    preferredLanguage?: string;
  };
}

interface UserParamsRequest extends Request {
  params: {
    id: string;
  };
}

export class UserController {
  static async getUsers(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать список пользователей
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const users = await UserModel.findAll();
      
      // Убираем пароли из ответа
      const usersWithoutPasswords = users.map(user => {
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      return res.json({
        users: usersWithoutPasswords,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getUser(req: UserParamsRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const userId = parseInt(req.params.id);
      
      // Пользователи могут просматривать только свой профиль, админы - любой
      if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const user = await UserModel.getUserWithStats(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Убираем пароль из ответа
      const { passwordHash, ...userWithoutPassword } = user;

      return res.json({
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createUser(req: CreateUserRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут создавать пользователей
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { email, name, password, role = 'USER', hasWebAccess = true, migrationStatus } = req.body;

      if (!email || !name || !password) {
        return res.status(400).json({ 
          error: 'Email, name and password are required' 
        });
      }

      if (password.length < 6) {
        return res.status(400).json({ 
          error: 'Password must be at least 6 characters long' 
        });
      }

      // Проверяем email формат
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          error: 'Invalid email format' 
        });
      }

      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ 
          error: 'User with this email already exists' 
        });
      }

      const user = await UserModel.create({
        email,
        name,
        password,
        role,
        isEmailVerified: true, // Админ создает уже верифицированных пользователей
        hasWebAccess,
        migrationStatus,
      });

      const { password: _, passwordHash: __, ...userWithoutPassword } = user;

      return res.status(201).json({
        message: 'User created successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }
  }

  static async updateUser(req: UpdateUserRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const userId = parseInt(req.params.id);
      const { email, name, password, role, hasWebAccess, migrationStatus, preferredLanguage } = req.body;

      // Пользователи могут редактировать только свой профиль, админы - любой
      if (req.user.role !== 'ADMIN' && req.user.id !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Проверяем email на уникальность если он изменяется
      if (email && email !== existingUser.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ 
            error: 'Invalid email format' 
          });
        }

        const userWithEmail = await UserModel.findByEmail(email);
        if (userWithEmail) {
          return res.status(400).json({ 
            error: 'User with this email already exists' 
          });
        }
      }

      // Подготавливаем обновления
      const updates: any = {};
      if (email) updates.email = email;
      if (name) updates.name = name;
      
      // Пользователи могут менять свой язык
      if (preferredLanguage !== undefined && ['en', 'ru'].includes(preferredLanguage)) {
        updates.preferredLanguage = preferredLanguage;
      }
      
      // Только админы могут менять роли, веб-доступ и статус миграции других пользователей
      if (req.user.role === 'ADMIN') {
        if (role !== undefined) updates.role = role;
        if (hasWebAccess !== undefined) updates.hasWebAccess = hasWebAccess;
        if (migrationStatus !== undefined) updates.migrationStatus = migrationStatus;
      }

      // Обновляем пароль если указан
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ 
            error: 'Password must be at least 6 characters long' 
          });
        }
        await UserModel.updatePassword(userId, password);
      }

      // Применяем остальные обновления
      if (Object.keys(updates).length > 0) {
        await UserModel.updateUser(userId, updates);
      }

      // Получаем обновленного пользователя
      const updatedUser = await UserModel.findById(userId);
      const { passwordHash, ...userWithoutPassword } = updatedUser!;

      return res.json({
        message: 'User updated successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error updating user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }
  }

  static async deleteUser(req: UserParamsRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут удалять пользователей
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const userId = parseInt(req.params.id);

      // Нельзя удалять самого себя
      if (req.user.id === userId) {
        return res.status(400).json({ 
          error: 'Cannot delete your own account' 
        });
      }

      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Удалить все VPN ключи пользователя
      const { VpnKeyModel } = await import('../models/VpnKey');
      const { vpnService } = await import('../services/vpnService');
      const { prisma } = await import('../utils/prisma');
      
      const userKeys = await VpnKeyModel.findByUserId(userId);
      
      // Сначала удаляем ключи с Outline сервера
      for (const key of userKeys) {
        try {
          await vpnService.removeVpnKey(key.outlineKeyId);
          console.log(`🗑️ Deleted key ${key.outlineKeyId} from Outline server`);
        } catch (error) {
          console.warn(`⚠️ Failed to delete key ${key.outlineKeyId} from Outline server:`, error);
          // Продолжаем даже если не получилось удалить с сервера
        }
      }
      
      // Теперь удаляем пользователя и его данные в транзакции
      await prisma.$transaction(async (tx) => {
        // Удаляем VPN ключи из БД
        await tx.vpnKey.deleteMany({
          where: { userId: userId }
        });
        
        // Удаляем сессии пользователя  
        await tx.userSession.deleteMany({
          where: { userId: userId }
        });
        
        // Удаляем пользователя (CASCADE в БД должен удалить остальные связанные записи)
        await tx.user.delete({
          where: { id: userId }
        });
      });

      return res.json({ 
        message: `User deleted successfully. Also deleted ${userKeys.length} VPN keys.`,
        deletedUser: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        deletedKeys: userKeys.length,
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  }

  static async getUserStats(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать общую статистику
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const users = await UserModel.findAll();
      const totalUsers = users.length;
      const adminUsers = users.filter(user => user.role === 'ADMIN').length;
      const regularUsers = users.filter(user => user.role === 'USER').length;
      const verifiedUsers = users.filter(user => user.isEmailVerified).length;

      // Статистика по датам регистрации
      const registrationStats = users.reduce((acc: any, user) => {
        const date = new Date(user.createdAt).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});

      return res.json({
        stats: {
          total: totalUsers,
          admins: adminUsers,
          users: regularUsers,
          verified: verifiedUsers,
          registrationByDate: registrationStats,
        },
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
  }

  static async updateLanguage(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { preferredLanguage } = req.body;

      if (!preferredLanguage || !['en', 'ru'].includes(preferredLanguage)) {
        return res.status(400).json({ 
          error: 'Valid language is required (en or ru)' 
        });
      }

      await UserModel.updateUser(req.user.id, { preferredLanguage });

      const updatedUser = await UserModel.findById(req.user.id);
      const { passwordHash, ...userWithoutPassword } = updatedUser!;

      return res.json({
        message: 'Language preference updated successfully',
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error('Error updating language preference:', error);
      return res.status(500).json({ error: 'Failed to update language preference' });
    }
  }
}