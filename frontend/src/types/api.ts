export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
  is_email_verified: boolean
  created_at: string
  updated_at: string
}

export interface VpnKey {
  id: number
  user_id: number
  outline_key_id: string
  access_url: string
  name?: string
  created_at: string
}

export interface OAuthClient {
  id: number
  client_id: string
  name: string
  description?: string
  redirect_uris: string[]
  scopes: string[]
  user_id: number
  is_trusted: boolean
  created_at: string
  updated_at: string
}

export interface LoginResponse {
  token: string
  refreshToken: string
  user: User
}

export interface ApiError {
  message: string
  statusCode?: number
}

export interface ApiResponse<T = any> {
  data?: T
  error?: ApiError
}

export interface CreateVpnKeyRequest {
  name?: string
}

export interface CreateUserRequest {
  email: string
  name: string
  password: string
  role?: 'admin' | 'user'
}

export interface CreateOAuthAppRequest {
  name: string
  description?: string
  redirect_uris: string[]
}

export interface UpdateUserRequest {
  name?: string
  email?: string
  role?: 'admin' | 'user'
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  name: string
  password: string
}