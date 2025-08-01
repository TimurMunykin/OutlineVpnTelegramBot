import { prisma } from '../utils/prisma'
import { Setting } from '@prisma/client'

export interface ICreateSetting {
  key: string
  value: string
  description?: string
}

export interface IUpdateSetting {
  value: string
  description?: string
}

export class SettingModel {
  // Default settings with their default values
  static readonly DEFAULT_SETTINGS = {
    'vpn.default_max_keys_per_user': {
      value: '5',
      description: 'Default maximum VPN keys per user'
    },
    'vpn.allow_user_key_creation': {
      value: 'true',
      description: 'Allow users to create their own VPN keys'
    },
    'system.site_name': {
      value: 'VPN Manager',
      description: 'Site name displayed in the interface'
    },
    'system.registration_enabled': {
      value: 'false',
      description: 'Allow public user registration'
    },
    'invites.default_expiration_days': {
      value: '7',
      description: 'Default invitation expiration in days'
    }
  }

  static async initializeDefaults(): Promise<void> {
    for (const [key, config] of Object.entries(this.DEFAULT_SETTINGS)) {
      const existing = await prisma.setting.findUnique({ where: { key } })
      if (!existing) {
        await prisma.setting.create({
          data: {
            key,
            value: config.value,
            description: config.description
          }
        })
      }
    }
  }

  static async get(key: string): Promise<string | null> {
    const setting = await prisma.setting.findUnique({ where: { key } })
    return setting?.value || null
  }

  static async getWithDefault(key: string, defaultValue: string): Promise<string> {
    const value = await this.get(key)
    return value || defaultValue
  }

  static async getInt(key: string, defaultValue: number): Promise<number> {
    const value = await this.get(key)
    if (!value) return defaultValue
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? defaultValue : parsed
  }

  static async getBool(key: string, defaultValue: boolean): Promise<boolean> {
    const value = await this.get(key)
    if (!value) return defaultValue
    return value.toLowerCase() === 'true'
  }

  static async set(key: string, value: string, description?: string): Promise<Setting> {
    return prisma.setting.upsert({
      where: { key },
      update: { 
        value, 
        description: description || undefined,
        updatedAt: new Date()
      },
      create: { key, value, description }
    })
  }

  static async getAll(): Promise<Setting[]> {
    return prisma.setting.findMany({
      orderBy: { key: 'asc' }
    })
  }

  static async delete(key: string): Promise<void> {
    await prisma.setting.delete({ where: { key } })
  }

  // Convenience methods for common settings
  static async getDefaultMaxKeysPerUser(): Promise<number> {
    return this.getInt('vpn.default_max_keys_per_user', 5)
  }

  static async isUserKeyCreationAllowed(): Promise<boolean> {
    return this.getBool('vpn.allow_user_key_creation', true)
  }

  static async getDefaultInviteExpirationDays(): Promise<number> {
    return this.getInt('invites.default_expiration_days', 7)
  }
}