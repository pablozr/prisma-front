export interface IProfessorProject {
  id: number
  title: string
  short_description: string
  full_description: string
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

export interface IProfessorProjectsPagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}
