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
  role: 'admin' | 'professor' | 'tecnico' | 'aluno' | string
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
  sie_project_id: number | null
  source_status: string | null
  source_type: string | null
  publication_status: 'draft' | 'published' | 'archived' | string
  is_visible: boolean
  updated_at: string
  published_at: string | null
  managers: IAdminProjectManager[]
}

export interface IAdminProjectUpdate {
  id: number
  process_code: string | null
  title: string
  source_status: string | null
  source_type: string | null
  publication_status: 'draft' | 'published' | 'archived' | string
  is_visible: boolean
  updated_at: string
  published_at: string | null
}

export interface IAdminProjectManager {
  person_id: number
  user_id: number | null
  profile: 'professor' | 'tecnico' | 'aluno' | string
  permission_source: string
}

export interface IAdminSyncRun {
  id: number
  source: string
  status: string
  is_complete: boolean
  started_at: string
  finished_at: string | null
  page_size: number
  pages_processed: number
  rows_received: number
  projects_upserted: number
  participants_upserted: number
  error_summary: string | null
}

export interface IAdminSyncRunFailure {
  sync_run_id: number
  error_summary: string
  finished_at: string | null
}
