import { Request, Response } from 'express';
import { VpnClientModel } from '../models/VpnClient';

interface CreateVpnClientRequest extends Request {
  body: {
    name: string;
    phone?: string;
    telegramId?: string;
    notes?: string;
    migrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    existingKeyId?: string; // Outline key ID to associate
  };
}

interface UpdateVpnClientRequest extends Request {
  params: {
    id: string;
  };
  body: {
    name?: string;
    phone?: string;
    telegramId?: string;
    notes?: string;
    migrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  };
}

interface VpnClientParamsRequest extends Request {
  params: {
    id: string;
  };
}

export class VpnClientController {
  static async getVpnClients(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать VPN клиентов
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const clients = await VpnClientModel.findAll();

      return res.json({
        clients,
      });
    } catch (error) {
      console.error('Error fetching VPN clients:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getVpnClient(req: VpnClientParamsRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать VPN клиентов
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const clientId = parseInt(req.params.id);
      const client = await VpnClientModel.findById(clientId);

      if (!client) {
        return res.status(404).json({ error: 'VPN client not found' });
      }

      return res.json({
        client,
      });
    } catch (error) {
      console.error('Error fetching VPN client:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async createVpnClient(req: CreateVpnClientRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут создавать VPN клиентов
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { name, phone, telegramId, notes, migrationStatus, existingKeyId } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({
          error: 'Name is required',
        });
      }

      const client = await VpnClientModel.create({
        name: name.trim(),
        phone: phone?.trim(),
        telegramId: telegramId?.trim(),
        notes: notes?.trim(),
        migrationStatus,
        createdBy: req.user.id,
      });

      // If existing key ID provided, associate it with the client
      if (existingKeyId) {
        const { vpnService } = await import('../services/vpnService');
        const { VpnKeyModel } = await import('../models/VpnKey');
        
        try {
          // Get key info from Outline server
          const keyInfo = await vpnService.getKeyInfo(existingKeyId);
          
          // Create VPN key record in database
          await VpnKeyModel.create({
            vpnClientId: client.id,
            outlineKeyId: existingKeyId,
            accessUrl: keyInfo.accessUrl,
            name: keyInfo.name || client.name,
          });
        } catch (error) {
          console.error('Error associating existing key:', error);
          // Don't fail client creation if key association fails
        }
      }

      return res.status(201).json({
        message: 'VPN client created successfully',
        client,
      });
    } catch (error) {
      console.error('Error creating VPN client:', error);
      return res.status(500).json({ error: 'Failed to create VPN client' });
    }
  }

  static async updateVpnClient(req: UpdateVpnClientRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут обновлять VPN клиентов
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const clientId = parseInt(req.params.id);
      const { name, phone, telegramId, notes, migrationStatus } = req.body;

      const existingClient = await VpnClientModel.findById(clientId);
      if (!existingClient) {
        return res.status(404).json({ error: 'VPN client not found' });
      }

      // Подготавливаем обновления
      const updates: any = {};
      if (name !== undefined) updates.name = name.trim();
      if (phone !== undefined) updates.phone = phone?.trim() || null;
      if (telegramId !== undefined) updates.telegramId = telegramId?.trim() || null;
      if (notes !== undefined) updates.notes = notes?.trim() || null;
      if (migrationStatus !== undefined) updates.migrationStatus = migrationStatus;

      const updatedClient = await VpnClientModel.update(clientId, updates);

      return res.json({
        message: 'VPN client updated successfully',
        client: updatedClient,
      });
    } catch (error) {
      console.error('Error updating VPN client:', error);
      return res.status(500).json({ error: 'Failed to update VPN client' });
    }
  }

  static async deleteVpnClient(req: VpnClientParamsRequest, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут удалять VPN клиентов
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const clientId = parseInt(req.params.id);

      const client = await VpnClientModel.findById(clientId);
      if (!client) {
        return res.status(404).json({ error: 'VPN client not found' });
      }

      // Переназначаем VPN ключи клиента как неназначенные (Unassigned)
      const { VpnKeyModel } = await import('../models/VpnKey');
      const { prisma } = await import('../utils/prisma');
      
      const clientKeys = await VpnKeyModel.findByVpnClientId(clientId);
      
      // В транзакции: переназначаем ключи и удаляем клиента
      await prisma.$transaction(async (tx) => {
        // Делаем все ключи VPN Client'а неназначенными
        await tx.vpnKey.updateMany({
          where: { vpnClientId: clientId },
          data: { 
            vpnClientId: null,
            userId: null  // Делаем ключи полностью неназначенными
          }
        });
        
        // Удаляем VPN Client
        await tx.vpnClient.delete({
          where: { id: clientId }
        });
      });

      return res.json({
        message: `VPN client deleted successfully. ${clientKeys.length} keys are now unassigned.`,
        deletedClient: {
          id: client.id,
          name: client.name,
        },
        unassignedKeys: clientKeys.length,
      });
    } catch (error) {
      console.error('Error deleting VPN client:', error);
      return res.status(500).json({ error: 'Failed to delete VPN client' });
    }
  }

  static async getVpnClientStats(req: Request, res: Response): Promise<Response> {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Только админы могут просматривать статистику
      if (req.user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const stats = await VpnClientModel.getStats();

      return res.json({
        stats,
      });
    } catch (error) {
      console.error('Error fetching VPN client stats:', error);
      return res.status(500).json({ error: 'Failed to fetch VPN client statistics' });
    }
  }
}