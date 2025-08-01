import { Request, Response } from 'express';
import { SettingModel } from '../models/Setting';
import { UserLimitModel } from '../models/UserLimit';
import { AuthenticatedRequest } from '../middleware/auth';
import { prisma } from '../utils/prisma';

interface UpdateSettingRequest extends AuthenticatedRequest {
  body: {
    key: string;
    value: string;
    description?: string;
  };
}

interface UpdateUserLimitRequest extends AuthenticatedRequest {
  params: {
    userId: string;
  };
  body: {
    maxVpnKeys?: number;
    canCreateKeys?: boolean;
    notes?: string;
  };
}

export class SettingsController {
  static async getSettings(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать настройки
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const settings = await SettingModel.getAll();

      res.json({
        settings,
      });
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateSetting(req: UpdateSettingRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут изменять настройки
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { key, value, description } = req.body;

      if (!key || value === undefined) {
        return res.status(400).json({
          error: 'Key and value are required',
        });
      }

      const setting = await SettingModel.set(key, value, description);

      res.json({
        message: 'Setting updated successfully',
        setting,
      });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ error: 'Failed to update setting' });
    }
  }

  static async getUserLimits(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать лимиты пользователей
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const usersWithLimits = await UserLimitModel.getUsersWithLimits();

      res.json({
        users: usersWithLimits,
      });
    } catch (error) {
      console.error('Error fetching user limits:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async updateUserLimit(req: UpdateUserLimitRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут изменять лимиты пользователей
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const userId = parseInt(req.params.userId);
      const { maxVpnKeys, canCreateKeys, notes } = req.body;

      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      // Проверяем, что пользователь существует
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const userLimit = await UserLimitModel.update(userId, {
        maxVpnKeys,
        canCreateKeys,
        notes,
      });

      res.json({
        message: 'User limit updated successfully',
        userLimit,
      });
    } catch (error) {
      console.error('Error updating user limit:', error);
      res.status(500).json({ error: 'Failed to update user limit' });
    }
  }

  static async deleteUserLimit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут удалять лимиты пользователей
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }

      await UserLimitModel.delete(userId);

      res.json({
        message: 'User limit removed successfully. User will use global defaults.',
      });
    } catch (error) {
      console.error('Error deleting user limit:', error);
      res.status(500).json({ error: 'Failed to delete user limit' });
    }
  }

  static async initializeSettings(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут инициализировать настройки
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      await SettingModel.initializeDefaults();

      res.json({
        message: 'Default settings initialized successfully',
      });
    } catch (error) {
      console.error('Error initializing settings:', error);
      res.status(500).json({ error: 'Failed to initialize settings' });
    }
  }
}