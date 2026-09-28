import type {
  ICourse,
  IOrganizationalUnit,
  IProject,
  IProjectArea,
  IProjectOpportunity
} from '../../src/app/modules/editais/interfaces/IProject'
import type { IUser } from '../../src/app/modules/global/interfaces/IUser'
import type { IManagedProject } from '../../src/app/modules/professor/interfaces/IProfessorProject'
import type {
  IAdminMetrics,
  IAdminProject,
  IAdminSyncRun,
  IAdminSyncRunFailure,
  IAdminUser
} from '../../src/app/modules/admin/interfaces/IAdmin'

/** Authenticated profiles used across scenarios. */
export const adminUser: IUser = {
  id: 1,
  institutional_email: 'admin@unirio.br',
  full_name: 'Admin Teste',
  role: 'admin',
  is_active: true
}

export const professorUser: IUser = {
  id: 3,
  institutional_email: 'professor@unirio.br',
  full_name: 'Joana Docente',
  role: 'professor',
  is_active: true
}

/** Catalogue fixtures served by `/catalogues/*`. */
export function buildAreas(): IProjectArea[] {
  return [
    { id: 1, name: 'Saúde', slug: 'saude' },
    { id: 2, name: 'Tecnologia', slug: 'tecnologia' }
  ]
}

export function buildCenters(): IOrganizationalUnit[] {
  return [
    { id: 10, name: 'CCET', unit_type: 'centro', parent_unit_id: null },
    { id: 11, name: 'CCBS', unit_type: 'centro', parent_unit_id: null }
  ]
}

export function buildUnits(): IOrganizationalUnit[] {
  return [
    { id: 20, name: 'Instituto de Computação', unit_type: 'unidade', parent_unit_id: 10 },
    { id: 21, name: 'Instituto Biomédico', unit_type: 'unidade', parent_unit_id: 11 }
  ]
}

export function buildCourses(): ICourse[] {
  return [
    {
      id: 30,
      name: 'Enfermagem',
      code: 'ENF',
      offering_unit: { id: 21, name: 'Instituto Biomédico', unit_type: 'unidade' }
    },
    {
      id: 31,
      name: 'Ciência da Computação',
      code: 'CCO',
      offering_unit: { id: 20, name: 'Instituto de Computação', unit_type: 'unidade' }
    }
  ]
}

export function catalogueFixtures(): {
  areas: IProjectArea[]
  centers: IOrganizationalUnit[]
  units: IOrganizationalUnit[]
  courses: ICourse[]
} {
  return {
    areas: buildAreas(),
    centers: buildCenters(),
    units: buildUnits(),
    courses: buildCourses()
  }
}

export interface PublicProjectOptions {
  id: number
  title: string
  summary?: string
  shortDescription?: string
  description?: string
  areaId?: number
  courseId?: number
  opportunities?: IProjectOpportunity[]
  publishedAt?: string | null
}

/** Builds a fully-shaped public project matching `IProject`. */
export function buildPublicProject(options: PublicProjectOptions): IProject {
  const centers = buildCenters()
  const units = buildUnits()
  const areas = buildAreas()
  const courses = buildCourses()

  return {
    id: options.id,
    sie_project_id: options.id * 10,
    process_code: `E-2024-${String(options.id).padStart(3, '0')}`,
    title: options.title,
    contacts: [
      {
        full_name: 'Coordenação acadêmica',
        institutional_email: `projeto${options.id}@unirio.br`,
        role: 'professor'
      }
    ],
    institutional: {
      summary: options.summary ?? `Resumo institucional de ${options.title}.`,
      type: 'Extensão',
      status: 'Em execução',
      starts_at: '2024-03-01',
      ends_at: '2025-12-31',
      center: centers[0],
      executing_unit: units[0]
    },
    editorial: {
      short_description: options.shortDescription ?? `Descrição curta de ${options.title}.`,
      description: options.description ?? `Descrição completa de ${options.title}.`,
      areas: options.areaId ? areas.filter(area => area.id === options.areaId) : [areas[0]],
      courses: options.courseId ? courses.filter(course => course.id === options.courseId) : [courses[0]],
      cover: null
    },
    opportunities: options.opportunities ?? [],
    published_at: options.publishedAt === undefined ? '2024-03-10T12:00:00.000Z' : options.publishedAt
  }
}

const PUBLIC_PROJECT_TITLES = [
  'Saúde coletiva e promoção da cidadania',
  'Biodiversidade da restinga de Maricá',
  'Robótica educacional para escolas públicas',
  'Memória e patrimônio cultural carioca',
  'Tecnologias assistivas e inclusão',
  'Educação ambiental em comunidades costeiras',
  'Análise de dados aplicada à gestão pública',
  'Música e formação cidadã',
  'Alimentação saudável na escola',
  'Letramento digital para idosos',
  'Observatório de políticas públicas',
  'Esporte e saúde na adolescência'
]

/** Twelve projects so the catalogue exercises a populated list. */
export function buildPublicProjects(): IProject[] {
  return PUBLIC_PROJECT_TITLES.map((title, index) =>
    buildPublicProject({
      id: index + 1,
      title,
      areaId: index % 2 === 0 ? 1 : 2
    })
  )
}

const MANAGED_PROJECT_TITLE = 'Projeto de Extensão em Saúde'

/** Builds the project managed through `/me/projects`. */
export function buildManagedProject(): IManagedProject {
  const base = buildPublicProject({
    id: 7,
    title: MANAGED_PROJECT_TITLE,
    shortDescription: 'Descrição curta original do projeto.',
    description: 'Descrição completa original do projeto.',
    courseId: 30
  })

  return {
    id: 7,
    sie_project_id: base.sie_project_id,
    process_code: base.process_code,
    title: base.title,
    institutional: { ...base.institutional },
    editorial: {
      short_description: base.editorial.short_description,
      description: base.editorial.description,
      areas: base.editorial.areas.map(area => ({ ...area })),
      courses: base.editorial.courses.map(course => ({ ...course })),
      cover: null
    },
    opportunities: [],
    published_at: base.published_at,
    access: { can_edit: true, role: 'professor' }
  }
}

export const managedProjectTitle = MANAGED_PROJECT_TITLE

/** Admin fixtures. */
export function buildAdminMetrics(): IAdminMetrics {
  return {
    total_projects: 1234,
    inactive_projects: 12,
    total_users: 567,
    active_users: 500
  }
}

export function buildAdminUsers(): IAdminUser[] {
  return [
    {
      id: 1,
      institutional_email: 'admin@unirio.br',
      full_name: 'Admin Teste',
      role: 'admin',
      is_active: true,
      created_at: '2024-01-01T00:00:00.000Z',
      last_login_at: '2024-06-01T10:00:00.000Z'
    },
    {
      id: 2,
      institutional_email: 'maria@unirio.br',
      full_name: 'Maria Docente',
      role: 'professor',
      is_active: true,
      created_at: '2024-02-01T00:00:00.000Z',
      last_login_at: null
    }
  ]
}

export function buildAdminProjects(): IAdminProject[] {
  return [
    {
      id: 7,
      process_code: 'E-2024-007',
      title: MANAGED_PROJECT_TITLE,
      sie_project_id: 70,
      source_status: 'Em execução',
      source_type: 'Extensão',
      publication_status: 'published',
      is_visible: true,
      updated_at: '2024-06-01T10:00:00.000Z',
      published_at: '2024-05-01T00:00:00.000Z',
      managers: [{ person_id: 1, user_id: 3, profile: 'professor', permission_source: 'sie' }]
    }
  ]
}

export function buildSyncRuns(): IAdminSyncRun[] {
  return [
    {
      id: 1,
      source: 'sie',
      status: 'partial',
      is_complete: false,
      started_at: '2024-06-01T10:00:00.000Z',
      finished_at: '2024-06-01T10:05:00.000Z',
      page_size: 100,
      pages_processed: 3,
      rows_received: 250,
      projects_upserted: 40,
      participants_upserted: 120,
      error_summary: 'Falha ao processar 2 registros do SIE.'
    }
  ]
}

export function buildSyncFailures(): Record<number, IAdminSyncRunFailure[]> {
  return {
    1: [
      {
        sync_run_id: 1,
        error_summary: 'Registro 42 inválido: campo obrigatório ausente',
        finished_at: '2024-06-01T10:05:00.000Z'
      }
    ]
  }
}

/** Aggregate admin payload consumed by the dashboard scenarios. */
export function buildAdminApiData(): {
  adminMetrics: IAdminMetrics
  adminUsers: IAdminUser[]
  adminProjects: IAdminProject[]
  syncRuns: IAdminSyncRun[]
  syncFailures: Record<number, IAdminSyncRunFailure[]>
} {
  return {
    adminMetrics: buildAdminMetrics(),
    adminUsers: buildAdminUsers(),
    adminProjects: buildAdminProjects(),
    syncRuns: buildSyncRuns(),
    syncFailures: buildSyncFailures()
  }
}
