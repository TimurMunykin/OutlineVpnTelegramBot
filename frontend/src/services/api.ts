import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || 'http://localhost:3001/api'

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          
          const { token } = response.data
          useAuthStore.getState().setToken(token)
          
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (email: string, name: string, password: string) =>
    api.post('/auth/register', { email, name, password }),
  
  logout: () => api.post('/auth/logout'),
  
  getMe: () => api.get('/auth/me'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
}

// VPN API
export const vpnApi = {
  getKeys: () => api.get('/vpn/keys'),
  
  getUnassociatedKeys: () => api.get('/vpn/unassociated-keys'),
  
  createKey: (name?: string, vpnClientId?: number) => api.post('/vpn/keys', { name, vpnClientId }),
  
  getKey: (id: string) => api.get(`/vpn/keys/${id}`),
  
  deleteKey: (id: string) => api.delete(`/vpn/keys/${id}`),
  
  updateKeyName: (id: string, name: string) =>
    api.put(`/vpn/keys/${id}`, { name }),
}

// VPN Clients API
export const vpnClientsApi = {
  getVpnClients: () => api.get('/vpn-clients'),
  
  getVpnClient: (id: number) => api.get(`/vpn-clients/${id}`),
  
  createVpnClient: (name: string, phone?: string, telegramId?: string, notes?: string, migrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED', existingKeyId?: string) =>
    api.post('/vpn-clients', { name, phone, telegramId, notes, migrationStatus, existingKeyId }),
  
  updateVpnClient: (id: number, updates: any) => api.put(`/vpn-clients/${id}`, updates),
  
  deleteVpnClient: (id: number) => api.delete(`/vpn-clients/${id}`),
  
  getVpnClientStats: () => api.get('/vpn-clients/stats'),
}

// Invites API
export const invitesApi = {
  getInvites: () => api.get('/invites'),
  
  createInvite: (vpnClientId: number, email?: string, expiresInDays?: number) =>
    api.post('/invites', { vpnClientId, email, expiresInDays }),
  
  validateInvite: (token: string) => api.get(`/invites/validate/${token}`),
  
  useInvite: (token: string, email: string, name: string, password: string) =>
    api.post('/invites/use', { token, email, name, password }),
  
  deleteInvite: (id: string) => api.delete(`/invites/${id}`),
  
  getInviteStats: () => api.get('/invites/stats'),
}

// Users API
export const usersApi = {
  getUsers: () => api.get('/users'),
  
  getUser: (id: number) => api.get(`/users/${id}`),
  
  createUser: (email: string, name: string, password: string, role: 'USER' | 'ADMIN', hasWebAccess?: boolean, migrationStatus?: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') =>
    api.post('/users', { email, name, password, role, hasWebAccess, migrationStatus }),
  
  updateUser: (id: number, updates: any) => api.put(`/users/${id}`, updates),
  
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  
  getUserStats: () => api.get('/users/stats'),
}

// OAuth API
export const oauthApi = {
  getApps: () => api.get('/oauth/apps'),
  
  createApp: (name: string, description: string, redirectUris: string[]) =>
    api.post('/oauth/apps', { name, description, redirect_uris: redirectUris }),
  
  updateApp: (id: number, updates: any) => api.put(`/oauth/apps/${id}`, updates),
  
  deleteApp: (id: number) => api.delete(`/oauth/apps/${id}`),
}

export default api