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

export interface IAdminImportBatch {
  id: number
  reference_year: number
  reference_term: number
  source_filename: string
  source_hash: string
  status: string
  total_rows: number
  imported_rows: number
  rejected_rows: number
  created_at: string
  finished_at: string | null
  uploaded_by_user_id: number | null
  uploaded_by_name: string | null
  uploaded_by_email: string | null
}

export interface IAdminImportError {
  id: number
  import_batch_id: number
  row_number: number
  raw_payload: unknown
  error_reason: string
  created_at: string
}
