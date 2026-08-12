export interface IProjectUnit {
  id: number
  name: string
  unit_type: 'centro' | 'unidade'
}

export interface IProfessorCourse {
  id: number
  name: string
  code: string | null
  offering_unit: IProjectUnit | null
}

export interface IManagedProjectInstitutionalData {
  summary: string | null
  type: string | null
  status: string | null
  starts_at: string | null
  ends_at: string | null
  center: IProjectUnit | null
  executing_unit: IProjectUnit | null
}

export interface IManagedProjectCover {
  id: number
  image_url: string
  alt_text: string | null
}

export interface IManagedProjectEditorialData {
  short_description: string | null
  description: string | null
  areas: { id: number; name: string; slug: string }[]
  courses: IProfessorCourse[]
  cover: IManagedProjectCover | null
}

export interface IProfessorProjectOpportunity {
  id: number
  project_id: number
  description: string
  courses: IProfessorCourse[]
}

export interface IManagedProject {
  id: number
  sie_project_id: number
  process_code: string | null
  title: string
  institutional: IManagedProjectInstitutionalData
  editorial: IManagedProjectEditorialData
  opportunities: IProfessorProjectOpportunity[]
  published_at: string | null
  access: { can_edit: boolean; role: 'admin' | 'professor' | 'tecnico' }
}

export interface IManagedProjectUpdate {
  id: number
  title: string
  short_description: string | null
  full_description: string | null
}

export interface IProfessorProjectsPagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}
