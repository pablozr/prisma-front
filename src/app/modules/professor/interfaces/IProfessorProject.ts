export interface IProfessorProject {
  id: number
  title: string
  short_description: string
  full_description: string
  cover_image_id?: number | null
  cover_image_url?: string | null
  cover_image_alt_text?: string | null
  status: string
  is_active: boolean
  process_code?: string
  contact_email?: string
  vacancies?: number
  weekly_hours?: number
  modality?: string
}

export interface IProfessorProjectAssignment {
  atribuicao_id: number
  projeto_id: number
  descricao: string
  curso_ids: number[]
}

export interface IProfessorCourse {
  id: number
  name: string
}

export interface IProfessorProjectsPagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}
