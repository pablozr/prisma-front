export type ProjectStatus = 'draft' | 'published' | 'archived'

export type UnitType = 'centro' | 'departamento' | 'instituto'

export type CourseLevel = 'graduacao' | 'pos'

export interface IProfessor {
  id: number
  full_name: string
  institutional_email: string
  siape?: string
  unit_id?: number
  avatar_url?: string
}

export interface IOrganizationalUnit {
  id: number
  name: string
  short_name?: string
  type: UnitType
  parent_unit_id?: number
}

export interface ICourse {
  id: number
  name: string
  level: CourseLevel
  unit_id?: number
  code?: string
}

export interface IProjectArea {
  id: number
  name: string
  slug: string
}

export interface IProjectImage {
  id: number
  image_type: 'cover' | 'gallery'
  image_url: string
  alt_text?: string
}

export interface IProject {
  id: number
  process_code?: string
  title: string
  short_description?: string
  full_description?: string
  contact_email: string
  status: ProjectStatus
  is_active: boolean
  starts_at?: string
  ends_at?: string
  published_at?: string
  created_at: string
  owner_professor: IProfessor
  executing_unit?: IOrganizationalUnit
  areas: IProjectArea[]
  courses: ICourse[]
  cover?: IProjectImage
  vacancies?: number
  weekly_hours?: number
  modality?: 'presencial' | 'remoto' | 'hibrido'
}

export interface IProjectFilters {
  search: string
  areaIds: number[]
  courseIds: number[]
  unitIds: number[]
  modality: IProject['modality'] | null
  deadline: 'open' | 'closing_soon' | 'closed' | null
  level: CourseLevel | null
  sort: 'recent' | 'deadline' | 'alphabetical'
}

export interface IEmailDispatch {
  project_id: number
  to_email: string
  subject: string
  body: string
}
