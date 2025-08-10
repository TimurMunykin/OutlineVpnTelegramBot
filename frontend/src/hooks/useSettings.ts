import { useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';

interface Setting {
  id: number;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserLimit {
  id: number;
  name: string;
  email: string;
  role: string;
  currentKeyCount: number;
  maxVpnKeys: number;
  canCreateKeys: boolean;
  isOverridden: boolean;
}

export const useSettings = () => {
  const { token } = useAuthStore();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [userLimits, setUserLimits] = useState<UserLimit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      clearMessages();

      const [settingsResponse, userLimitsResponse] = await Promise.all([
        fetch('/api/settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
        fetch('/api/settings/user-limits', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }),
      ]);

      if (!settingsResponse.ok || !userLimitsResponse.ok) {
        throw new Error('Failed to load settings');
      }

      const settingsData = await settingsResponse.json();
      const userLimitsData = await userLimitsResponse.json();

      setSettings(settingsData.settings);
      setUserLimits(userLimitsData.users);
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [token, clearMessages, showError]);

  const updateSetting = useCallback(async (key: string, value: string) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      showSuccess('Setting updated successfully');
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update setting');
    }
  }, [token, loadData, showError, showSuccess]);

  const initializeSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/settings/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize settings');
      }

      showSuccess('Default settings initialized successfully');
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to initialize settings');
    }
  }, [token, loadData, showError, showSuccess]);

  const updateUserLimit = useCallback(async (
    userId: number, 
    data: { maxVpnKeys: number; canCreateKeys: boolean }
  ) => {
    try {
      const response = await fetch(`/api/settings/user-limits/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update user limit');
      }

      showSuccess('User limit updated successfully');
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to update user limit');
    }
  }, [token, loadData, showError, showSuccess]);

  const deleteUserLimit = useCallback(async (userId: number) => {
    try {
      const response = await fetch(`/api/settings/user-limits/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to remove user limit');
      }

      showSuccess('User limit removed - user will use global defaults');
      await loadData();
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to remove user limit');
    }
  }, [token, loadData, showError, showSuccess]);

  return {
    settings,
    userLimits,
    loading,
    error,
    success,
    loadData,
    updateSetting,
    initializeSettings,
    updateUserLimit,
    deleteUserLimit,
  };
};