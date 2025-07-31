import { OutlineVPN } from 'outlinevpn-api'
import { createError } from '@/middleware/errorHandler'
import { VpnKeyModel } from '@/models/VpnKey'

class VpnService {
  private outlineVpn: OutlineVPN;

  constructor() {
    const apiUrl = process.env.OUTLINE_API_URL;
    const fingerprint = process.env.OUTLINE_API_FINGERPRINT;

    if (!apiUrl || !fingerprint) {
      throw new Error('OUTLINE_API_URL and OUTLINE_API_FINGERPRINT must be set');
    }

    this.outlineVpn = new OutlineVPN({
      apiUrl,
      fingerprint,
    });
  }

  async createVpnKey(userId: number, name?: string): Promise<{ id: string; accessUrl: string; dbKey: any }> {
    try {
      const key = await this.outlineVpn.createUser()
      
      // Set name if provided
      if (name) {
        await this.outlineVpn.renameUser(key.id, name)
      }

      // Save to database
      const dbKey = await VpnKeyModel.create({
        userId,
        outlineKeyId: key.id,
        accessUrl: key.accessUrl,
        name,
      })

      return {
        id: key.id,
        accessUrl: key.accessUrl,
        dbKey,
      }
    } catch (error) {
      console.error('Error creating VPN key:', error)
      throw createError('Could not create VPN key', 500)
    }
  }

  async listVpnKeys(): Promise<Array<{ id: string; name?: string; accessUrl: string }>> {
    try {
      const keys = await this.outlineVpn.getUsers();
      return keys.map((key: any) => ({
        id: key.id,
        name: key.name,
        accessUrl: key.accessUrl
      }));
    } catch (error) {
      console.error('Error listing VPN keys:', error);
      throw createError('Could not list VPN keys', 500);
    }
  }

  async removeVpnKey(keyId: string): Promise<void> {
    try {
      // Delete from Outline VPN server
      await this.outlineVpn.deleteUser(keyId)
      
      // Delete from database
      await VpnKeyModel.deleteByOutlineKeyId(keyId)
    } catch (error) {
      console.error(`Error removing VPN key ${keyId}:`, error)
      throw createError(`Could not remove VPN key ${keyId}`, 500)
    }
  }

  async getKeyInfo(keyId: string): Promise<any> {
    try {
      const keyInfo = await this.outlineVpn.getUser(keyId);
      return keyInfo;
    } catch (error) {
      console.error(`Error fetching info for VPN key ${keyId}:`, error);
      throw createError(`Could not fetch info for VPN key ${keyId}`, 404);
    }
  }

  async renameKey(keyId: string, name: string): Promise<void> {
    try {
      await this.outlineVpn.renameUser(keyId, name);
    } catch (error) {
      console.error(`Error renaming VPN key ${keyId}:`, error);
      throw createError(`Could not rename VPN key ${keyId}`, 500);
    }
  }

  async getServerInfo(): Promise<any> {
    try {
      const info = await this.outlineVpn.getServer()
      return info
    } catch (error) {
      console.error('Error getting server info:', error)
      throw createError('Could not get server info', 500)
    }
  }
}

export const vpnService = new VpnService();