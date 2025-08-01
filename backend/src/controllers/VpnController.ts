import { Response } from 'express';
import { vpnService } from '../services/vpnService';
import { VpnKeyModel } from '../models/VpnKey';
import { vpnSyncService } from '../services/VpnSyncService';
import { AuthenticatedRequest } from '../middleware/auth';

interface CreateKeyRequest extends AuthenticatedRequest {
  body: {
    name?: string;
    vpnClientId?: number; // For creating keys for VPN clients
  };
}

interface KeyParamsRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
}

interface UpdateKeyRequest extends AuthenticatedRequest {
  params: {
    id: string;
  };
  body: {
    name: string;
  };
}

export class VpnController {
  // Вспомогательная функция для синхронизации
  private static async ensureSync(): Promise<void> {
    try {
      await vpnSyncService.syncWithOutlineServer();
    } catch (syncError) {
      console.warn('Sync failed, continuing with DB data:', syncError);
    }
  }
  static async getUnassociatedKeys(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать неассоциированные ключи
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      // Получаем все ключи с Outline сервера
      const outlineKeys = await vpnService.listVpnKeys();
      
      // Получаем все ключи из нашей БД
      const dbKeys = await VpnKeyModel.findAll(1000); // Берем много, чтобы точно все получить
      const dbKeyIds = new Set(dbKeys.map(key => key.outlineKeyId));

      // Фильтруем неассоциированные ключи
      const unassociatedKeys = outlineKeys.filter(key => !dbKeyIds.has(key.id));

      res.json({
        keys: unassociatedKeys,
      });
    } catch (error) {
      console.error('Error fetching unassociated keys:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getKeys(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Синхронизация перед получением ключей
      await VpnController.ensureSync();

      let keys;
      
      if (req.user.role === 'ADMIN') {
        // Admin can see all keys
        keys = await VpnKeyModel.findAll();
      } else {
        // Regular users can only see their own keys
        keys = await VpnKeyModel.findByUserId(req.user.id);
      }

      // Enrich with user and client info for admin
      const keysWithUserInfo = await Promise.all(
        keys.map(async (key) => {
          if (req.user?.role === 'ADMIN') {
            const keyWithDetails = await VpnKeyModel.getKeyWithUser(key.id);
            return {
              ...key,
              user: keyWithDetails?.user ? {
                id: keyWithDetails.user.id,
                name: keyWithDetails.user.name,
                email: keyWithDetails.user.email,
                role: keyWithDetails.user.role,
              } : null,
              vpnClient: keyWithDetails?.vpnClient ? {
                id: keyWithDetails.vpnClient.id,
                name: keyWithDetails.vpnClient.name,
                phone: keyWithDetails.vpnClient.phone,
                migrationStatus: keyWithDetails.vpnClient.migrationStatus,
              } : null,
            };
          }
          return key;
        })
      );

      res.json({
        keys: keysWithUserInfo,
      });
    } catch (error) {
      console.error('Error fetching VPN keys:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createKey(req: CreateKeyRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const { name, vpnClientId } = req.body;

      // Validate input: either for current user or for VPN client (admin only)
      if (vpnClientId && req.user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Only admins can create keys for VPN clients'
        });
      }

      // Check user's key limit (optional business rule)
      if (!vpnClientId && req.user.role !== 'ADMIN') {
        const userKeys = await VpnKeyModel.findByUserId(req.user.id);
        const maxKeysPerUser = parseInt(process.env.MAX_KEYS_PER_USER || '5');
        
        if (userKeys.length >= maxKeysPerUser) {
          return res.status(400).json({ 
            error: `Maximum ${maxKeysPerUser} keys per user allowed` 
          });
        }
      }

      // If creating for VPN client, validate client exists
      if (vpnClientId) {
        const { VpnClientModel } = await import('../models/VpnClient');
        const vpnClient = await VpnClientModel.findById(vpnClientId);
        if (!vpnClient) {
          return res.status(404).json({ error: 'VPN client not found' });
        }
      }

      const result = await vpnService.createVpnKey(
        vpnClientId ? undefined : req.user.id,
        vpnClientId,
        name
      );

      // Синхронизация после создания ключа, чтобы обновить состояние
      await VpnController.ensureSync();

      res.status(201).json({
        message: 'VPN key created successfully',
        key: {
          id: result.dbKey.id,
          outlineKeyId: result.id,
          accessUrl: result.accessUrl,
          name: result.dbKey.name,
          createdAt: result.dbKey.createdAt,
        },
      });
    } catch (error) {
      console.error('Error creating VPN key:', error);
      res.status(500).json({ error: 'Failed to create VPN key' });
    }
  }

  static async getKey(req: KeyParamsRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const keyId = parseInt(req.params.id);
      const key = await VpnKeyModel.findById(keyId);

      if (!key) {
        return res.status(404).json({ error: 'VPN key not found' });
      }

      // Check ownership (non-admin users can only see their own keys)
      if (req.user.role !== 'ADMIN' && key.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Get additional info from Outline server
      try {
        const outlineInfo = await vpnService.getKeyInfo(key.outlineKeyId);
        
        res.json({
          key: {
            ...key,
            outlineInfo,
          },
        });
      } catch (outlineError) {
        // If Outline server error, return DB info only
        res.json({ key });
      }
    } catch (error) {
      console.error('Error fetching VPN key:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async deleteKey(req: KeyParamsRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const keyId = parseInt(req.params.id);
      const key = await VpnKeyModel.findById(keyId);

      if (!key) {
        return res.status(404).json({ error: 'VPN key not found' });
      }

      // Check ownership (non-admin users can only delete their own keys)
      if (req.user.role !== 'ADMIN' && key.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await vpnService.removeVpnKey(key.outlineKeyId);

      // Синхронизация после удаления ключа
      await VpnController.ensureSync();

      res.json({ message: 'VPN key deleted successfully' });
    } catch (error) {
      console.error('Error deleting VPN key:', error);
      res.status(500).json({ error: 'Failed to delete VPN key' });
    }
  }

  static async updateKey(req: UpdateKeyRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const keyId = parseInt(req.params.id);
      const { name } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const key = await VpnKeyModel.findById(keyId);

      if (!key) {
        return res.status(404).json({ error: 'VPN key not found' });
      }

      // Check ownership (non-admin users can only update their own keys)
      if (req.user.role !== 'ADMIN' && key.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      // Update name on Outline server
      await vpnService.renameKey(key.outlineKeyId, name);

      // Update name in database
      const updatedKey = await VpnKeyModel.updateName(keyId, name);

      res.json({
        message: 'VPN key updated successfully',
        key: updatedKey,
      });
    } catch (error) {
      console.error('Error updating VPN key:', error);
      res.status(500).json({ error: 'Failed to update VPN key' });
    }
  }


  static async reassignKey(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { outlineKeyId } = req.params;
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      await vpnSyncService.reassignKey(outlineKeyId, parseInt(userId));

      res.json({ message: 'Key reassigned successfully' });
    } catch (error) {
      console.error('Error reassigning key:', error);
      res.status(500).json({ error: 'Failed to reassign key' });
    }
  }
}