export const API_BASE_URL = 'http://localhost:5685/api/v1/unirio'

export const AUTH_ROUTES = {
  login: `${API_BASE_URL}/auth/login`,
  googleLogin: `${API_BASE_URL}/auth/google/login`,
  me: `${API_BASE_URL}/auth/me`,
  logout: `${API_BASE_URL}/auth/logout`,
  refresh: `${API_BASE_URL}/auth/refresh`,
  forgetPassword: `${API_BASE_URL}/auth/forget-password`,
  validateCode: `${API_BASE_URL}/auth/validate-code`,
  updatePassword: `${API_BASE_URL}/auth/update-password`
} as const
