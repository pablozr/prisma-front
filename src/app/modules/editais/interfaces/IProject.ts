export type UnitType = 'centro' | 'unidade'

export interface IOrganizationalUnit {
  id: number
  name: string
  unit_type: UnitType
  parent_unit_id?: number | null
}

export interface ICourse {
  id: number
  name: string
  code: string | null
  offering_unit: IOrganizationalUnit | null
}

export interface IProjectArea {
  id: number
  name: string
  slug: string
}

export interface IProjectCover {
  id: number
  image_url: string
  alt_text: string | null
}

export interface IProjectContact {
  full_name: string
  institutional_email: string
  role: 'professor' | 'tecnico' | string
}

export interface IProjectInstitutionalData {
  summary: string | null
  type: string | null
  status: string | null
  starts_at: string | null
  ends_at: string | null
  center: IOrganizationalUnit | null
  executing_unit: IOrganizationalUnit | null
}

export interface IProjectEditorialData {
  short_description: string | null
  description: string | null
  areas: IProjectArea[]
  courses: ICourse[]
  cover: IProjectCover | null
}

export interface IProjectOpportunity {
  id: number
  description: string
  courses: ICourse[]
}

export interface IProject {
  id: number
  sie_project_id: number
  process_code: string | null
  title: string
  contacts: IProjectContact[]
  institutional: IProjectInstitutionalData
  editorial: IProjectEditorialData
  opportunities: IProjectOpportunity[]
  published_at: string | null
}

export interface IProjectFilters {
  search: string
  areaIds: number[]
  courseIds: number[]
  centerIds: number[]
  academicUnitIds: number[]
  sort: 'recent' | 'alphabetical'
}
