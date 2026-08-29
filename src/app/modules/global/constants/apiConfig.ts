import { environment } from '../../../../environments/environment'

export const API_BASE_URL = environment.apiUrl

export const AUTH_ROUTES = {
  login: `${API_BASE_URL}/auth/login`,
  googleStart: `${API_BASE_URL}/auth/google/start`,
  me: `${API_BASE_URL}/auth/me`,
  logout: `${API_BASE_URL}/auth/logout`,
  refresh: `${API_BASE_URL}/auth/refresh`
} as const
