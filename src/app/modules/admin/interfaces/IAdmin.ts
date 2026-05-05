export interface IAdminMetrics {
  total_projects: number
  inactive_projects: number
  total_users: number
  active_users: number
}

export interface IAdminUser {
  id: number
  institutional_email: string
  full_name: string
  role: 'admin' | 'professor' | 'tecnico' | string
  is_active: boolean
  created_at: string
  last_login_at: string | null
}

export interface IAdminUsersPagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}
