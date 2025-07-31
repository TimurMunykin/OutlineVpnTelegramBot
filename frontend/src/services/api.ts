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
  
  createKey: (name?: string) => api.post('/vpn/keys', { name }),
  
  getKey: (id: string) => api.get(`/vpn/keys/${id}`),
  
  deleteKey: (id: string) => api.delete(`/vpn/keys/${id}`),
  
  updateKeyName: (id: string, name: string) =>
    api.put(`/vpn/keys/${id}`, { name }),
}

// Users API
export const usersApi = {
  getUsers: () => api.get('/users'),
  
  createUser: (email: string, name: string, password: string, role: 'admin' | 'user') =>
    api.post('/users', { email, name, password, role }),
  
  updateUser: (id: number, updates: any) => api.put(`/users/${id}`, updates),
  
  deleteUser: (id: number) => api.delete(`/users/${id}`),
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