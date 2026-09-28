import { expect, type Page, type Route } from '@playwright/test'
import type { ICourse, IOrganizationalUnit, IProject, IProjectArea } from '../../src/app/modules/editais/interfaces/IProject'
import type { IUser } from '../../src/app/modules/global/interfaces/IUser'
import type { IManagedProject } from '../../src/app/modules/professor/interfaces/IProfessorProject'
import type {
  IAdminMetrics,
  IAdminProject,
  IAdminSyncRun,
  IAdminSyncRunFailure,
  IAdminUser
} from '../../src/app/modules/admin/interfaces/IAdmin'

const API_GLOB = '**/api/v1/unirio/**'

export interface MockRequest {
  method: string
  path: string
  query: URLSearchParams
  body: unknown
}

export interface ApiMockConfig {
  /** Session hydrated through `/auth/me`. `null`/omitted means unauthenticated. */
  session?: IUser | null
  /** Accounts accepted by `POST /auth/login`, keyed by e-mail. */
  login?: Record<string, IUser>
  publicProjects?: IProject[]
  managedProjects?: IManagedProject[]
  areas?: IProjectArea[]
  centers?: IOrganizationalUnit[]
  units?: IOrganizationalUnit[]
  courses?: ICourse[]
  adminMetrics?: IAdminMetrics
  adminUsers?: IAdminUser[]
  adminProjects?: IAdminProject[]
  syncRuns?: IAdminSyncRun[]
  syncFailures?: Record<number, IAdminSyncRunFailure[]>
  /** Number of `GET /projects` list calls answered with HTTP 500 before succeeding. */
  projectListFailures?: number
}

export interface ApiMock {
  requests: MockRequest[]
  find(method: string, path: string): MockRequest[]
}

interface Pagination {
  page: number
  page_size: number
  total: number
  total_pages: number
}

function paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; pagination: Pagination } {
  const total = items.length
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      page,
      page_size: pageSize,
      total,
      total_pages: Math.max(1, Math.ceil(total / pageSize))
    }
  }
}

function readNumber(value: string | null, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function matchesQuery(fields: Array<string | null | undefined>, query: string): boolean {
  if (!query) return true
  return fields.some(field => (field ?? '').toLowerCase().includes(query))
}

/**
 * Installs one deterministic route handler for the whole API surface.
 * Must be called before navigating the page so `/auth/me` is intercepted.
 */
export async function installApiMock(page: Page, config: ApiMockConfig = {}): Promise<ApiMock> {
  const accounts = Object.fromEntries(
    Object.entries(config.login ?? {}).map(([email, user]) => [email.toLowerCase(), user])
  )

  const state = {
    session: config.session ? (structuredClone(config.session) as IUser) : null,
    publicProjects: structuredClone(config.publicProjects ?? []) as IProject[],
    managedProjects: structuredClone(config.managedProjects ?? []) as IManagedProject[],
    adminUsers: structuredClone(config.adminUsers ?? []) as IAdminUser[],
    adminProjects: structuredClone(config.adminProjects ?? []) as IAdminProject[],
    adminMetrics: structuredClone(config.adminMetrics ?? buildEmptyMetrics()) as IAdminMetrics,
    areas: structuredClone(config.areas ?? []) as IProjectArea[],
    centers: structuredClone(config.centers ?? []) as IOrganizationalUnit[],
    units: structuredClone(config.units ?? []) as IOrganizationalUnit[],
    courses: structuredClone(config.courses ?? []) as ICourse[],
    projectListFailures: config.projectListFailures ?? 0,
    nextOpportunityId: 101
  }

  const requests: MockRequest[] = []

  const corsHeaders = (route: Route) => {
    const origin = route.request().headers()['origin'] ?? '*'
    return {
      'access-control-allow-origin': origin,
      'access-control-allow-credentials': 'true',
      'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
      'access-control-allow-headers': 'content-type,authorization,accept',
      'access-control-max-age': '600'
    }
  }

  const json = (route: Route, status: number, payload?: unknown) =>
    route.fulfill({
      status,
      headers: { ...corsHeaders(route), 'content-type': 'application/json' },
      body: payload === undefined ? '' : JSON.stringify(payload)
    })

  const envelope = <T>(data: T, message = 'ok') => ({ message, data })

  await page.route(API_GLOB, async route => {
    const request = route.request()
    const method = request.method()
    const url = new URL(request.url())
    const path = url.pathname.replace('/api/v1/unirio', '')

    let body: unknown
    try {
      body = request.postDataJSON()
    } catch {
      body = request.postData() ?? undefined
    }

    requests.push({ method, path, query: url.searchParams, body })

    if (method === 'OPTIONS') {
      await route.fulfill({ status: 204, headers: corsHeaders(route) })
      return
    }

    // ----- Auth -----
    if (path === '/auth/login' && method === 'POST') {
      const credentials = (body ?? {}) as { email?: string }
      const account = credentials.email ? accounts[credentials.email.toLowerCase()] : undefined
      if (account) {
        state.session = account
        return json(route, 200, { message: 'ok' })
      }
      return json(route, 401, { detail: 'Email ou senha incorretos' })
    }

    if (path === '/auth/me' && method === 'GET') {
      if (state.session) return json(route, 200, envelope({ user: state.session }))
      return json(route, 401, { detail: 'Não autenticado' })
    }

    if (path === '/auth/refresh' && method === 'POST') {
      if (state.session) return json(route, 200, { message: 'ok' })
      return json(route, 401, { detail: 'Sessão expirada' })
    }

    if (path === '/auth/logout' && method === 'POST') {
      state.session = null
      return json(route, 200, { message: 'ok' })
    }

    // ----- Public catalogue -----
    if (path === '/projects' && method === 'GET') {
      if (state.projectListFailures > 0) {
        state.projectListFailures -= 1
        return json(route, 500, { detail: 'Falha simulada no catálogo' })
      }

      const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const page = readNumber(url.searchParams.get('page'), 1)
      const pageSize = readNumber(url.searchParams.get('page_size'), 20)
      const filtered = state.publicProjects.filter(project =>
        matchesQuery(
          [
            project.title,
            project.institutional.summary,
            project.editorial.short_description,
            project.editorial.description
          ],
          query
        )
      )
      const ordered =
        url.searchParams.get('ordenacao') === 'titulo_asc'
          ? [...filtered].sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'))
          : filtered
      const { items, pagination } = paginate(ordered, page, pageSize)
      return json(route, 200, envelope({ projetos: items, paginacao: pagination }))
    }

    if (path === '/catalogues/areas-tematicas' && method === 'GET') {
      return json(route, 200, envelope(state.areas))
    }
    if (path === '/catalogues/unidades' && method === 'GET') {
      return json(route, 200, envelope(state.units))
    }
    if (path === '/catalogues/centros' && method === 'GET') {
      return json(route, 200, envelope(state.centers))
    }
    if (path === '/catalogues/cursos' && method === 'GET') {
      return json(route, 200, envelope(state.courses))
    }

    const publicDetails = path.match(/^\/projects\/(\d+)$/)
    if (publicDetails && method === 'GET') {
      const project = state.publicProjects.find(item => item.id === Number(publicDetails[1]))
      if (project) return json(route, 200, envelope({ projeto: project }))
      return json(route, 404, { detail: 'Projeto não encontrado' })
    }

    // ----- Professor (authenticated) -----
    if (path === '/me/projects' && method === 'GET') {
      const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const page = readNumber(url.searchParams.get('page'), 1)
      const pageSize = readNumber(url.searchParams.get('page_size'), 10)
      const filtered = state.managedProjects.filter(project =>
        matchesQuery([project.title, project.institutional.summary], query)
      )
      const { items, pagination } = paginate(filtered, page, pageSize)
      return json(route, 200, envelope({ projetos: items, paginacao: pagination }))
    }

    const managedDetails = path.match(/^\/me\/projects\/(\d+)$/)
    if (managedDetails && method === 'GET') {
      const project = state.managedProjects.find(item => item.id === Number(managedDetails[1]))
      if (project) return json(route, 200, envelope({ projeto: project }))
      return json(route, 404, { detail: 'Projeto não encontrado' })
    }

    const projectLogo = path.match(/^\/projects\/(\d+)\/logo$/)
    if (projectLogo && method === 'POST') {
      return json(
        route,
        200,
        envelope({
          logo: {
            projeto_id: Number(projectLogo[1]),
            image_url: 'https://example.test/logo-atualizada.png',
            alt_text: 'Logo atualizada'
          }
        })
      )
    }

    const projectOpportunities = path.match(/^\/projects\/(\d+)\/opportunities$/)
    if (projectOpportunities && method === 'POST') {
      const projectId = Number(projectOpportunities[1])
      const project = state.managedProjects.find(item => item.id === projectId)
      const payload = (body ?? {}) as { descricao?: string; curso_ids?: number[] }
      const coursesById = new Map((project?.editorial.courses ?? []).map(course => [course.id, course]))
      const opportunity = {
        id: state.nextOpportunityId++,
        project_id: projectId,
        description: payload.descricao ?? '',
        courses: (payload.curso_ids ?? [])
          .map(id => coursesById.get(id))
          .filter((course): course is NonNullable<typeof course> => Boolean(course))
      }
      if (project) project.opportunities = [...project.opportunities, opportunity]
      return json(route, 201, envelope({ opportunity }))
    }

    const projectPatch = path.match(/^\/projects\/(\d+)$/)
    if (projectPatch && method === 'PATCH') {
      const projectId = Number(projectPatch[1])
      const project = state.managedProjects.find(item => item.id === projectId)
      const payload = (body ?? {}) as { descricao?: string | null; descricao_curta?: string | null }
      if (project) {
        if ('descricao' in payload) project.editorial.description = payload.descricao ?? null
        if ('descricao_curta' in payload) project.editorial.short_description = payload.descricao_curta ?? null
      }
      return json(
        route,
        200,
        envelope({
          projeto: {
            id: projectId,
            title: project?.title ?? '',
            short_description: project?.editorial.short_description ?? null,
            full_description: project?.editorial.description ?? null
          }
        })
      )
    }

    const opportunityDelete = path.match(/^\/opportunities\/(\d+)$/)
    if (opportunityDelete && method === 'DELETE') {
      const opportunityId = Number(opportunityDelete[1])
      for (const project of state.managedProjects) {
        project.opportunities = project.opportunities.filter(opportunity => opportunity.id !== opportunityId)
      }
      return json(route, 200, { message: 'ok' })
    }

    // ----- Admin -----
    if (path === '/admin/metrics' && method === 'GET') {
      return json(route, 200, envelope({ metrics: state.adminMetrics }))
    }

    if (path === '/admin/users' && method === 'GET') {
      const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const page = readNumber(url.searchParams.get('page'), 1)
      const pageSize = readNumber(url.searchParams.get('page_size'), 10)
      const filtered = state.adminUsers.filter(user =>
        matchesQuery([user.full_name, user.institutional_email], query)
      )
      const { items, pagination } = paginate(filtered, page, pageSize)
      return json(route, 200, envelope({ users: items, pagination }))
    }

    if (path === '/admin/projects' && method === 'GET') {
      const query = (url.searchParams.get('q') ?? '').trim().toLowerCase()
      const page = readNumber(url.searchParams.get('page'), 1)
      const pageSize = readNumber(url.searchParams.get('page_size'), 10)
      const filtered = state.adminProjects.filter(project =>
        matchesQuery([project.title, project.process_code], query)
      )
      const { items, pagination } = paginate(filtered, page, pageSize)
      return json(route, 200, envelope({ projects: items, pagination }))
    }

    if (path === '/admin/sync-runs' && method === 'GET') {
      const page = readNumber(url.searchParams.get('page'), 1)
      const pageSize = readNumber(url.searchParams.get('page_size'), 10)
      const { items, pagination } = paginate(config.syncRuns ?? [], page, pageSize)
      return json(route, 200, envelope({ sync_runs: items, pagination }))
    }

    const syncFailures = path.match(/^\/admin\/sync-runs\/(\d+)\/failures$/)
    if (syncFailures && method === 'GET') {
      const failures = config.syncFailures?.[Number(syncFailures[1])] ?? []
      const page = readNumber(url.searchParams.get('page'), 1)
      const pageSize = readNumber(url.searchParams.get('page_size'), 20)
      const { items, pagination } = paginate(failures, page, pageSize)
      return json(route, 200, envelope({ failures: items, pagination }))
    }

    const adminUserPatch = path.match(/^\/admin\/users\/(\d+)$/)
    if (adminUserPatch && method === 'PATCH') {
      const userId = Number(adminUserPatch[1])
      const payload = (body ?? {}) as { role?: IAdminUser['role']; is_active?: boolean }
      const user = state.adminUsers.find(item => item.id === userId)
      if (user) {
        if (payload.role !== undefined) user.role = payload.role
        if (payload.is_active !== undefined) user.is_active = payload.is_active
      }
      if (!user) return json(route, 404, { detail: 'Usuário não encontrado' })
      return json(route, 200, envelope({ user }))
    }

    const adminProjectPatch = path.match(/^\/admin\/projects\/(\d+)$/)
    if (adminProjectPatch && method === 'PATCH') {
      const projectId = Number(adminProjectPatch[1])
      const payload = (body ?? {}) as { publication_status?: IAdminProject['publication_status']; is_visible?: boolean }
      const project = state.adminProjects.find(item => item.id === projectId)
      if (project) {
        if (payload.publication_status !== undefined) project.publication_status = payload.publication_status
        if (payload.is_visible !== undefined) project.is_visible = payload.is_visible
      }
      if (!project) return json(route, 404, { detail: 'Projeto não encontrado' })
      return json(route, 200, envelope({ project }))
    }

    return json(route, 404, { detail: `Rota não mockada: ${method} ${path}` })
  })

  return {
    requests,
    find: (method: string, path: string) => requests.filter(request => request.method === method && request.path === path)
  }
}

function buildEmptyMetrics(): IAdminMetrics {
  return { total_projects: 0, inactive_projects: 0, total_users: 0, active_users: 0 }
}

/** Waits until at least one request matching method+path has been recorded. */
export async function waitForRequest(mock: ApiMock, method: string, path: string, timeout = 10_000): Promise<void> {
  await expect
    .poll(() => mock.find(method, path).length, { message: `Expected ${method} ${path}`, timeout })
    .toBeGreaterThan(0)
}

/** Returns the most recent request matching method+path. */
export function lastRequest(mock: ApiMock, method: string, path: string): MockRequest | undefined {
  return mock.find(method, path).at(-1)
}
