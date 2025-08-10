import { vpnService } from './vpnService';
import { VpnKeyModel } from '../models/VpnKey';
import { UserModel } from '../models/User';

export class VpnSyncService {
  /**
   * Синхронизирует состояние между Outline сервером и локальной БД
   * - Удаляет из БД ключи, которых нет на сервере
   * - Добавляет в БД ключи с сервера (назначает админу или ищет по имени)
   * - Обновляет информацию о существующих ключах
   */
  async syncWithOutlineServer(): Promise<{
    added: number;
    removed: number;
    updated: number;
    orphaned: number;
  }> {
    try {
      console.log('🔄 Starting sync with Outline server...');
      
      const [outlineKeys, dbKeys] = await Promise.all([
        vpnService.listVpnKeys(),
        VpnKeyModel.findAll()
      ]);

      let added = 0;
      let removed = 0;
      let updated = 0;
      let orphaned = 0;

      // 1. Удалить из БД ключи, которых нет на Outline сервере
      console.log(`📋 Found ${dbKeys.length} keys in DB, ${outlineKeys.length} on server`);
      
      const serverKeyIds = new Set(outlineKeys.map(k => k.id));
      const keysToRemove = dbKeys.filter(dbKey => !serverKeyIds.has(dbKey.outlineKeyId));

      for (const dbKey of keysToRemove) {
        console.log(`🗑️ Removing orphaned key from DB: ${dbKey.outlineKeyId}`);
        await VpnKeyModel.delete(dbKey.id);
        removed++;
      }

      // 2. Обработать ключи с Outline сервера
      const dbKeyMap = new Map();
      
      // Создаем мапу с учетом возможных дубликатов в БД
      for (const dbKey of dbKeys) {
        if (!dbKeyMap.has(dbKey.outlineKeyId)) {
          dbKeyMap.set(dbKey.outlineKeyId, []);
        }
        dbKeyMap.get(dbKey.outlineKeyId).push(dbKey);
      }

      for (const outlineKey of outlineKeys) {
        const existingDbKeys = dbKeyMap.get(outlineKey.id) || [];

        if (existingDbKeys.length > 0) {
          // 3. Если есть дубликаты в БД - удалить лишние, оставить один
          if (existingDbKeys.length > 1) {
            console.log(`🔄 Found ${existingDbKeys.length} duplicates for key ${outlineKey.id}, removing extras`);
            
            // Оставляем первый, удаляем остальные
            const [keepKey, ...duplicates] = existingDbKeys;
            for (const duplicate of duplicates) {
              await VpnKeyModel.delete(duplicate.id);
              removed++;
            }
          }

          // Обновить оставшийся ключ если нужно
          const keepKey = existingDbKeys[0];
          const needsUpdate = 
            keepKey.accessUrl !== outlineKey.accessUrl ||
            keepKey.name !== outlineKey.name;

          if (needsUpdate) {
            console.log(`📝 Updating key ${outlineKey.id} in DB`);
            await VpnKeyModel.updateName(keepKey.id, outlineKey.name || '');
            updated++;
          }
        } else {
          // 4. Добавить новый ключ в БД
          const assignedUser = await this.determineKeyOwner(outlineKey);
          
          if (assignedUser) {
            console.log(`➕ Adding new key ${outlineKey.id} to DB, assigned to user ${assignedUser.id}`);
            
            await VpnKeyModel.create({
              userId: assignedUser.id,
              outlineKeyId: outlineKey.id,
              accessUrl: outlineKey.accessUrl,
              name: outlineKey.name || `Key ${outlineKey.id}`,
            });
            
            if (assignedUser.id === 1) { // Если назначен админу как orphaned
              orphaned++;
            } else {
              added++;
            }
          } else {
            console.log(`➕ Adding new unassigned key ${outlineKey.id} to DB`);
            
            await VpnKeyModel.create({
              userId: undefined,
              outlineKeyId: outlineKey.id,
              accessUrl: outlineKey.accessUrl,
              name: outlineKey.name || `Key ${outlineKey.id}`,
            });
            
            orphaned++;
          }
        }
      }

      const result = { added, removed, updated, orphaned };
      console.log('✅ Sync completed:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Sync failed:', error);
      throw error;
    }
  }

  /**
   * Определяет кому назначить ключ из Outline сервера
   * Пытается найти пользователя по имени ключа, иначе оставляет неназначенным
   */
  private async determineKeyOwner(outlineKey: any): Promise<{ id: number; email: string } | null> {
    // Стратегия 1: Поиск по имени ключа
    if (outlineKey.name) {
      // Попробовать найти пользователя по email в имени ключа
      const emailMatch = outlineKey.name.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        const email = emailMatch[1];
        const user = await UserModel.findByEmail(email);
        if (user) {
          console.log(`🎯 Found user by email in key name: ${user.email}`);
          return { id: user.id, email: user.email };
        }
      }

      // Попробовать найти пользователя по частичному совпадению имени
      const users = await UserModel.findAll(100, 0);
      const nameWords = outlineKey.name.toLowerCase().split(/[\s\-_]+/);
      
      for (const user of users) {
        const userNameWords = user.name.toLowerCase().split(/[\s\-_]+/);
        const hasMatch = nameWords.some((word: string) => 
          userNameWords.some((userWord: string) => 
            word.includes(userWord) || userWord.includes(word)
          )
        );
        
        if (hasMatch) {
          console.log(`🎯 Found user by name similarity: ${user.email} (key: "${outlineKey.name}")`);
          return { id: user.id, email: user.email };
        }
      }
    }

    // Стратегия 2: Оставить неназначенным (по умолчанию)
    console.log(`🔓 Leaving key unassigned: ${outlineKey.name || outlineKey.id}`);
    return null;
  }

  /**
   * Переназначает ключ другому пользователю
   */
  async reassignKey(outlineKeyId: string, newUserId: number): Promise<void> {
    const dbKey = await VpnKeyModel.findByOutlineKeyId(outlineKeyId);
    if (!dbKey) {
      throw new Error(`Key ${outlineKeyId} not found in database`);
    }

    const newUser = await UserModel.findById(newUserId);
    if (!newUser) {
      throw new Error(`User ${newUserId} not found`);
    }

    // Обновить владельца в БД
    await VpnKeyModel.updateOwner(dbKey.id, newUserId);
    
    // Опционально: обновить имя ключа на сервере
    const newKeyName = `${newUser.name} - ${newUser.email}`;
    await vpnService.renameKey(outlineKeyId, newKeyName);

    console.log(`🔄 Reassigned key ${outlineKeyId} to ${newUser.email}`);
  }

  /**
   * Получает статистику синхронизации
   */
  async getSyncStatus(): Promise<{
    totalKeys: number;
    serverKeys: number;
    dbKeys: number;
    orphanedKeys: number;
    lastSync: Date | null;
  }> {
    try {
      const [outlineKeys, dbKeys] = await Promise.all([
        vpnService.listVpnKeys(),
        VpnKeyModel.findAll()
      ]);

      const serverKeyIds = new Set(outlineKeys.map(k => k.id));
      const orphanedKeys = dbKeys.filter(k => !serverKeyIds.has(k.outlineKeyId)).length;

      return {
        totalKeys: Math.max(outlineKeys.length, dbKeys.length),
        serverKeys: outlineKeys.length,
        dbKeys: dbKeys.length,
        orphanedKeys,
        lastSync: new Date(), // TODO: сохранять время последней синхронизации
      };
    } catch (error) {
      console.error('Failed to get sync status:', error);
      throw error;
    }
  }
}

export const vpnSyncService = new VpnSyncService();