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

export interface IAdminProject {
  id: number
  process_code: string | null
  title: string
  short_description: string | null
  status: 'draft' | 'published' | 'archived' | string
  is_active: boolean
  updated_at: string
  published_at: string | null
  responsible_id: number | null
  responsible_name: string | null
  responsible_email: string | null
  responsible_type: 'docente' | 'tecnico' | string
}
