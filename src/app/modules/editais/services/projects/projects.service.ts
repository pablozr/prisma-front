import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { Observable, catchError, forkJoin, map, of, shareReplay, tap, throwError } from 'rxjs'
import {
  ICourse,
  IOrganizationalUnit,
  IProfessor,
  IProject,
  IProjectAssignment,
  IProjectArea,
  IProjectFilters
} from '../../interfaces/IProject'
import { inject } from '@angular/core'
import { API_BASE_URL } from '../../../global/constants/apiConfig'
import { AppToastService } from '../../../global/services/toast/app-toast.service'

interface IApiResponse<TData> {
  message: string
  data: TData
}

interface IAreasCatalogueItem {
  id: number
  name: string
  slug: string
}

interface IUnitsCatalogueItem {
  id: number
  name: string
  short_name?: string | null
  type?: string
  parent_unit_id?: number | null
}

interface ICoursesCatalogueItem {
  id: number
  name: string
  code?: string | null
  level?: ICourse['level'] | string
  unit_id?: number
  offering_unit_id?: number
  offering_unit_name?: string
  offering_unit_short_name?: string | null
  offering_unit_type?: string
}

interface IProjectsListItem {
  id: number
  title: string
  short_description?: string
  contact_email?: string | null
  owner_professor_name?: string
  owner_professor_email?: string | null
  owner_professor_institutional_email?: string | null
  executing_unit_name?: string
  area_ids: number[]
  course_ids: number[]
  status?: string
  starts_at?: string
  ends_at?: string
  published_at?: string
  created_at?: string
  process_code?: string
  vacancies?: number
  weekly_hours?: number
  modality?: IProject['modality']
  cover_image_id?: number | null
  cover_image_url?: string | null
  cover_image_alt_text?: string | null
}

interface IProjectsListPagination {
  page?: number
  page_size?: number
  total?: number
  total_pages?: number
}

export interface IProjectsPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface IProjectsListResponse {
  projects: IProject[]
  pagination: IProjectsPagination
}

interface IProjectsListPayload {
  projects?: IProjectsListItem[]
  projetos?: IProjectsListItem[]
  pagination?: IProjectsListPagination
  paginacao?: IProjectsListPagination
}

interface IProjectDetailsArea {
  id: number
  name: string
  slug: string
}

interface IProjectDetailsCourse {
  id: number
  name: string
  unit_id?: number
  offering_unit_id?: number
  code?: string
  level?: ICourse['level'] | string
}

interface IProjectDetailsImage {
  id: number
  image_type: 'cover' | 'gallery'
  image_url: string
  alt_text?: string
}

interface IProjectDetails {
  id: number
  title: string
  process_code?: string
  short_description?: string
  full_description?: string
  contact_email?: string
  status?: string
  is_active?: boolean
  starts_at?: string
  ends_at?: string
  published_at?: string
  created_at?: string
  owner_professor_id?: number
  owner_professor_name?: string
  executing_unit_id?: number
  executing_unit_name?: string
  executing_unit_short_name?: string
  executing_unit_type?: string
  vacancies?: number
  weekly_hours?: number
  modality?: IProject['modality']
  areas: IProjectDetailsArea[] | string
  courses?: IProjectDetailsCourse[] | string
  cursos?: IProjectDetailsCourse[] | string
  atribuicoes?: IProjectAssignment[] | string
  images?: IProjectDetailsImage[] | string
  imagens?: IProjectDetailsImage[] | string
}

interface IProjectDetailsPayload {
  project?: IProjectDetails
  projeto?: IProjectDetails
}

type IProjectsApiSort = 'titulo_asc' | 'titulo_desc' | 'data_desc'

const EDITAIS_ROUTES = {
  listProjects: `${API_BASE_URL}/projects`,
  projectDetails: (projectId: number) => `${API_BASE_URL}/projects/${projectId}`,
  listAreas: `${API_BASE_URL}/catalogues/areas-tematicas`,
  listUnits: `${API_BASE_URL}/catalogues/unidades`,
  listCenters: `${API_BASE_URL}/catalogues/centros`,
  listCourses: `${API_BASE_URL}/catalogues/cursos`
} as const

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient)
  private toast = inject(AppToastService)
  private withCreds = { withCredentials: true } as const
  private readonly projectDetailsCache = new Map<number, Observable<IProjectDetails>>()
  private readonly unitsByCenterCache = new Map<string, Observable<IOrganizationalUnit[]>>()
  private readonly coursesByUnitCache = new Map<string, Observable<ICourse[]>>()
  private areasSnapshot: IProjectArea[] = []
  private unitsSnapshot: IOrganizationalUnit[] = []
  private coursesSnapshot: ICourse[] = []

  private readonly catalogueParams = new HttpParams({
    fromObject: {
      limit: '100',
      offset: '0'
    }
  })

  private readonly areasCache$ = this.http
    .get<IApiResponse<IAreasCatalogueItem[]>>(EDITAIS_ROUTES.listAreas, {
      params: this.catalogueParams
    })
    .pipe(
      map(res =>
        (res?.data || []).map(area => ({
          id: area.id,
          name: area.name,
          slug: area.slug
        }))
      ),
      tap(areas => {
        this.areasSnapshot = areas
      }),
      catchError((err: unknown) => {
        if (!this.isCatalogueEmptyError(err)) {
          this.toast.error(
            'Falha ao carregar áreas',
            this.extractDetail(err, 'Nao foi possivel carregar as áreas temáticas.')
          )
        }
        return of([])
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    )

  private readonly centersCache$ = this.http
    .get<IApiResponse<IUnitsCatalogueItem[]>>(EDITAIS_ROUTES.listCenters, {
      params: this.catalogueParams
    })
    .pipe(
      map(res => this.mapCentersCatalogue(res?.data || [])),
      tap(centers => {
        this.rememberUnits(centers)
      }),
      catchError((err: unknown) => {
        if (!this.isCatalogueEmptyError(err)) {
          this.toast.error(
            'Falha ao carregar centros',
            this.extractDetail(err, 'Nao foi possivel carregar os centros da UNIRIO.')
          )
        }
        return of([])
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    )

  private readonly academicUnitsCache$ = this.requestAcademicUnits()
    .pipe(shareReplay({ bufferSize: 1, refCount: false }))

  private readonly unitsCache$ = forkJoin({
    centers: this.centersCache$,
    academicUnits: this.academicUnitsCache$
  }).pipe(
    map(({ centers, academicUnits }) => this.mergeUnitsCatalogues(centers, academicUnits)),
    shareReplay({ bufferSize: 1, refCount: false })
  )

  private readonly coursesCache$ = this.requestCourses().pipe(
    shareReplay({ bufferSize: 1, refCount: false })
  )

  listProjects(
    filters?: IProjectFilters,
    page = 1,
    pageSize = 20
  ): Observable<IProjectsListResponse> {
    const params = this.buildProjectsParams(filters, page, pageSize)

    return this.http
      .get<IApiResponse<IProjectsListPayload>>(EDITAIS_ROUTES.listProjects, {
        params
      })
      .pipe(
        map(projectsResponse => {
          const payload = projectsResponse?.data
          const summaries = this.extractProjectsList(payload)
          const projects = this.mapSummariesToProjects(summaries)

          return {
            projects,
            pagination: this.extractPagination(payload, page, pageSize, projects.length)
          }
        }),
        catchError((err: unknown) => {
          this.toast.error(
            'Falha ao carregar editais',
            this.extractDetail(err, 'Nao foi possivel carregar a lista de editais.')
          )
          return of({
            projects: [],
            pagination: {
              page,
              pageSize,
              total: 0,
              totalPages: 1
            }
          })
        })
      )
  }

  enrichProjectsWithCatalogData(projects: IProject[]): IProject[] {
    if (!projects.length) {
      return projects
    }

    const areasById = new Map(this.areasSnapshot.map(area => [area.id, area]))
    const coursesById = new Map(this.coursesSnapshot.map(course => [course.id, course]))

    return projects.map(project => {
      const mappedAreas = project.areas.map(area => areasById.get(area.id) || area)
      const mappedCourses = project.courses.map(course => coursesById.get(course.id) || course)
      const mappedUnit = project.executing_unit
        ? this.resolveExecutingUnit(project.executing_unit.name, this.unitsSnapshot) || project.executing_unit
        : project.executing_unit

      return {
        ...project,
        areas: mappedAreas,
        courses: mappedCourses,
        executing_unit: mappedUnit
      }
    })
  }

  listUnits(centerIds?: number[]): Observable<IOrganizationalUnit[]> {
    const normalizedCenterIds = this.normalizeIdArray(centerIds)
    if (!normalizedCenterIds.length) {
      return this.unitsCache$
    }

    const cacheKey = normalizedCenterIds.join(',')
    const cached = this.unitsByCenterCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const request$ = forkJoin({
      centers: this.centersCache$,
      academicUnits: this.requestAcademicUnits(normalizedCenterIds)
    }).pipe(
      map(({ centers, academicUnits }) => this.mergeUnitsCatalogues(centers, academicUnits)),
      shareReplay({ bufferSize: 1, refCount: false })
    )

    this.unitsByCenterCache.set(cacheKey, request$)
    return request$
  }

  listAreas(): Observable<IProjectArea[]> {
    return this.areasCache$
  }

  listCourses(unitIds?: number[]): Observable<ICourse[]> {
    const normalizedUnitIds = this.normalizeIdArray(unitIds)
    if (!normalizedUnitIds.length) {
      return this.coursesCache$
    }

    const cacheKey = normalizedUnitIds.join(',')
    const cached = this.coursesByUnitCache.get(cacheKey)
    if (cached) {
      return cached
    }

    const request$ = this.requestCourses(normalizedUnitIds).pipe(
      shareReplay({ bufferSize: 1, refCount: false })
    )

    this.coursesByUnitCache.set(cacheKey, request$)
    return request$
  }

  getProjectDetails(project: IProject): Observable<IProject> {
    return this.fetchProjectDetails(project.id).pipe(
      map(details => this.mergeDetails(project, details)),
      catchError((err: unknown) => {
        this.toast.error(
          'Falha ao carregar detalhes',
          this.extractDetail(err, 'Nao foi possivel carregar os detalhes do edital.')
        )
        return of(project)
      })
    )
  }

  private fetchProjectDetails(projectId: number): Observable<IProjectDetails> {
    const cachedRequest = this.projectDetailsCache.get(projectId)
    if (cachedRequest) return cachedRequest

    const request$ = this.http
      .get<IApiResponse<IProjectDetailsPayload>>(EDITAIS_ROUTES.projectDetails(projectId))
      .pipe(
        map(response => {
          const project = this.extractProjectDetails(response?.data)
          if (!project) {
            throw new Error('Project details payload is empty')
          }
          return project
        }),
        catchError((err: unknown) => {
          this.projectDetailsCache.delete(projectId)
          return throwError(() => err)
        }),
        shareReplay({ bufferSize: 1, refCount: false })
      )

    this.projectDetailsCache.set(projectId, request$)
    return request$
  }

  private requestAcademicUnits(centerIds?: number[]): Observable<IOrganizationalUnit[]> {
    let params = this.catalogueParams
    params = this.appendArrayQueryParam(params, 'centro_ids', centerIds)

    return this.http
      .get<IApiResponse<IUnitsCatalogueItem[]>>(EDITAIS_ROUTES.listUnits, {
        params
      })
      .pipe(
        map(res =>
          this.mapUnitsCatalogue(res?.data || []).filter(unit => this.isAcademicUnit(unit.type))
        ),
        tap(units => {
          this.rememberUnits(units)
        }),
        catchError((err: unknown) => {
          if (!this.isCatalogueEmptyError(err)) {
            this.toast.error(
              'Falha ao carregar unidades',
              this.extractDetail(err, 'Nao foi possivel carregar as unidades da UNIRIO.')
            )
          }
          return of([])
        })
      )
  }

  private requestCourses(unitIds?: number[]): Observable<ICourse[]> {
    let params = this.catalogueParams
    params = this.appendArrayQueryParam(params, 'unidade_ids', unitIds)

    return this.http
      .get<IApiResponse<ICoursesCatalogueItem[]>>(EDITAIS_ROUTES.listCourses, {
        params
      })
      .pipe(
        map(res => this.mapCoursesCatalogue(res?.data || [])),
        tap(courses => {
          this.rememberCourses(courses)
        }),
        catchError((err: unknown) => {
          if (!this.isCatalogueEmptyError(err)) {
            this.toast.error(
              'Falha ao carregar cursos',
              this.extractDetail(err, 'Nao foi possivel carregar os cursos da UNIRIO.')
            )
          }
          return of([])
        })
      )
  }

  private extractProjectsList(payload: IProjectsListPayload | undefined): IProjectsListItem[] {
    if (!payload) {
      return []
    }

    if (Array.isArray(payload.projects)) {
      return payload.projects
    }

    if (Array.isArray(payload.projetos)) {
      return payload.projetos
    }

    return []
  }

  private extractProjectDetails(payload: IProjectDetailsPayload | undefined): IProjectDetails | undefined {
    return payload?.project || payload?.projeto
  }

  private extractPagination(
    payload: IProjectsListPayload | undefined,
    requestedPage: number,
    requestedPageSize: number,
    currentBatchSize: number
  ): IProjectsPagination {
    const fallbackPage = this.normalizePositiveInt(requestedPage, 1)
    const fallbackPageSize = this.normalizePositiveInt(requestedPageSize, 20)
    const source = payload?.pagination || payload?.paginacao

    const page = this.normalizePositiveInt(source?.page, fallbackPage)
    const pageSize = this.normalizePositiveInt(source?.page_size, fallbackPageSize)
    const total = this.normalizePositiveInt(source?.total, currentBatchSize)
    const totalPages = this.normalizePositiveInt(
      source?.total_pages,
      Math.max(1, Math.ceil(total / pageSize))
    )

    return {
      page,
      pageSize,
      total,
      totalPages
    }
  }

  private normalizePositiveInt(value: number | undefined, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      return fallback
    }

    const normalized = Math.trunc(value)
    return normalized > 0 ? normalized : fallback
  }

  private mergeUnitsCatalogues(
    centers: IOrganizationalUnit[],
    academicUnits: IOrganizationalUnit[]
  ): IOrganizationalUnit[] {
    const unitsById = new Map<number, IOrganizationalUnit>()

    for (const unit of [...centers, ...academicUnits]) {
      unitsById.set(unit.id, unit)
    }

    const mergedUnits = [...unitsById.values()]
    this.rememberUnits(mergedUnits)
    return mergedUnits
  }

  private rememberUnits(units: IOrganizationalUnit[]) {
    if (!units.length) {
      return
    }

    const unitsById = new Map(this.unitsSnapshot.map(unit => [unit.id, unit]))
    for (const unit of units) {
      unitsById.set(unit.id, unit)
    }

    this.unitsSnapshot = [...unitsById.values()]
  }

  private rememberCourses(courses: ICourse[]) {
    if (!courses.length) {
      return
    }

    const coursesById = new Map(this.coursesSnapshot.map(course => [course.id, course]))
    for (const course of courses) {
      coursesById.set(course.id, course)
    }

    this.coursesSnapshot = [...coursesById.values()]
  }

  private normalizeIdArray(ids: number[] | undefined): number[] {
    if (!ids?.length) {
      return []
    }

    const uniqueIds = new Set(ids.filter(id => Number.isInteger(id) && id > 0))
    return [...uniqueIds].sort((a, b) => a - b)
  }

  private isCatalogueEmptyError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 400
  }

  private isAcademicUnit(type: IOrganizationalUnit['type']): boolean {
    return type === 'instituto' || type === 'escola'
  }

  private buildProjectsParams(
    filters: IProjectFilters | undefined,
    page: number,
    pageSize: number
  ): HttpParams {
    let params = new HttpParams({
      fromObject: {
        page: String(this.normalizePositiveInt(page, 1)),
        page_size: String(this.normalizePositiveInt(pageSize, 20)),
        somente_habilitados: 'true'
      }
    })

    const search = filters?.search?.trim()
    if (search) {
      params = params.set('q', search)
    }

    params = this.appendArrayQueryParam(params, 'area_ids', filters?.areaIds)
    params = this.appendArrayQueryParam(params, 'unidade_ids', this.resolveUnitsForFilter(filters))
    params = this.appendArrayQueryParam(params, 'curso_ids', filters?.courseIds)

    const apiSort = this.mapSortToApi(filters?.sort)
    if (apiSort) {
      params = params.set('ordenacao', apiSort)
    }

    return params
  }

  private resolveUnitsForFilter(filters?: IProjectFilters): number[] {
    if (filters?.academicUnitIds?.length) {
      return this.normalizeIdArray(filters.academicUnitIds)
    }

    return this.normalizeIdArray(filters?.centerIds)
  }

  private appendArrayQueryParam(
    params: HttpParams,
    key: string,
    values: number[] | undefined
  ): HttpParams {
    if (!values?.length) {
      return params
    }

    return values.reduce((nextParams, value) => nextParams.append(key, String(value)), params)
  }

  private mapSortToApi(sort: IProjectFilters['sort'] | undefined): IProjectsApiSort | undefined {
    if (sort === 'alphabetical') {
      return 'titulo_asc'
    }

    if (sort === 'recent') {
      return 'data_desc'
    }

    return undefined
  }

  private mapCentersCatalogue(centers: IUnitsCatalogueItem[]): IOrganizationalUnit[] {
    return centers.map(center => ({
      id: center.id,
      name: center.name,
      short_name: center.short_name ?? undefined,
      type: 'centro'
    }))
  }

  private mapUnitsCatalogue(units: IUnitsCatalogueItem[]): IOrganizationalUnit[] {
    return units.map(unit => ({
      id: unit.id,
      name: unit.name,
      short_name: unit.short_name ?? undefined,
      type: this.normalizeUnitType(unit.type),
      parent_unit_id: unit.parent_unit_id ?? undefined
    }))
  }

  private mapCoursesCatalogue(courses: ICoursesCatalogueItem[]): ICourse[] {
    const coursesById = new Map<number, ICourse>()

    for (const course of courses) {
      coursesById.set(course.id, {
        id: course.id,
        name: course.name,
        code: course.code ?? undefined,
        level: this.normalizeCourseLevel(course.level, course.name),
        unit_id: course.offering_unit_id ?? course.unit_id
      })
    }

    return [...coursesById.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }

  private mapSummariesToProjects(
    summaries: IProjectsListItem[],
    areas: IProjectArea[] = this.areasSnapshot,
    units: IOrganizationalUnit[] = this.unitsSnapshot,
    courses: ICourse[] = this.coursesSnapshot
  ): IProject[] {
    const areasById = new Map(areas.map(area => [area.id, area]))
    const coursesById = new Map(courses.map(course => [course.id, course]))

    return summaries.map(summary => {
      const areaIds = Array.isArray(summary.area_ids) ? summary.area_ids : []
      const courseIds = Array.isArray(summary.course_ids) ? summary.course_ids : []

      const mappedAreas = areaIds.map(areaId => {
        const area = areasById.get(areaId)
        if (area) return area

        return {
          id: areaId,
          name: `Área #${areaId}`,
          slug: `area-${areaId}`
        }
      })

      const mappedCourses: ICourse[] = courseIds.map(courseId => {
        const course = coursesById.get(courseId)
        if (course) {
          return course
        }

        return {
          id: courseId,
          name: `Curso #${courseId}`,
          level: 'graduacao'
        }
      })

      const ownerProfessorEmail =
        summary.owner_professor_institutional_email?.trim() ||
        summary.owner_professor_email?.trim() ||
        ''

      const ownerProfessor: IProfessor = {
        id: 0,
        full_name: summary.owner_professor_name || 'Professor(a) nao informado(a)',
        institutional_email: ownerProfessorEmail
      }

      const executingUnit = this.resolveExecutingUnit(summary.executing_unit_name, units)
      const cover = this.mapSummaryCover(summary)

      return {
        id: summary.id,
        process_code: summary.process_code,
        title: summary.title,
        short_description: summary.short_description,
        contact_email: summary.contact_email?.trim() || ownerProfessorEmail,
        status: this.normalizeStatus(summary.status),
        is_active: true,
        starts_at: summary.starts_at,
        ends_at: summary.ends_at,
        published_at: summary.published_at,
        created_at: summary.created_at || summary.published_at || new Date().toISOString(),
        owner_professor: ownerProfessor,
        executing_unit: executingUnit,
        areas: mappedAreas,
        courses: mappedCourses,
        assignments: [],
        cover,
        vacancies: summary.vacancies,
        weekly_hours: summary.weekly_hours,
        modality: summary.modality
      }
    })
  }

  private mapSummaryCover(summary: IProjectsListItem): IProject['cover'] {
    const imageUrl = summary.cover_image_url?.trim()
    if (!imageUrl) {
      return undefined
    }

    return {
      id: summary.cover_image_id ?? summary.id,
      image_type: 'cover',
      image_url: imageUrl,
      alt_text: summary.cover_image_alt_text || undefined
    }
  }

  private mergeDetails(project: IProject, details: IProjectDetails): IProject {
    const images = this.parseJsonArray<IProjectDetailsImage>(details.images ?? details.imagens)
    const cover = images.find(image => image.image_type === 'cover')

    const areas = this.parseJsonArray<IProjectDetailsArea>(details.areas).map(area => ({
      id: area.id,
      name: area.name,
      slug: area.slug
    }))

    const courses: ICourse[] = this.parseJsonArray<IProjectDetailsCourse>(
      details.courses ?? details.cursos
    ).map(
      course => ({
        id: course.id,
        name: course.name,
        code: course.code ?? undefined,
        level: this.normalizeCourseLevel(course.level, course.name),
        unit_id: course.unit_id ?? course.offering_unit_id
      })
    )

    const executingUnit: IOrganizationalUnit | undefined = details.executing_unit_name
      ? {
          id: details.executing_unit_id ?? project.executing_unit?.id ?? -1,
          name: details.executing_unit_name,
          short_name: details.executing_unit_short_name || project.executing_unit?.short_name,
          type: this.normalizeUnitType(details.executing_unit_type)
        }
      : project.executing_unit

    const assignments = this.parseAssignments(details.atribuicoes)

    return {
      ...project,
      process_code: details.process_code || project.process_code,
      title: details.title || project.title,
      short_description: details.short_description || project.short_description,
      full_description: details.full_description || project.full_description,
      contact_email: details.contact_email || project.contact_email,
      status: this.normalizeStatus(details.status || project.status),
      is_active: details.is_active ?? project.is_active,
      starts_at: details.starts_at || project.starts_at,
      ends_at: details.ends_at || project.ends_at,
      published_at: details.published_at || project.published_at,
      created_at: details.created_at || project.created_at,
      owner_professor: {
        ...project.owner_professor,
        id: details.owner_professor_id ?? project.owner_professor.id,
        full_name: details.owner_professor_name || project.owner_professor.full_name
      },
      executing_unit: executingUnit,
      areas: areas.length ? areas : project.areas,
      courses: courses.length ? courses : project.courses,
      assignments: assignments.length ? assignments : project.assignments,
      cover: cover
        ? {
            id: cover.id,
            image_type: cover.image_type,
            image_url: cover.image_url,
            alt_text: cover.alt_text
          }
        : project.cover,
      vacancies: details.vacancies ?? project.vacancies,
      weekly_hours: details.weekly_hours ?? project.weekly_hours,
      modality: details.modality || project.modality
    }
  }

  private parseJsonArray<TItem>(value: TItem[] | string | undefined): TItem[] {
    if (Array.isArray(value)) {
      return value
    }

    if (typeof value !== 'string') {
      return []
    }

    const raw = value.trim()
    if (!raw) {
      return []
    }

    try {
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? (parsed as TItem[]) : []
    } catch {
      return []
    }
  }

  private parseAssignments(value: IProjectAssignment[] | string | null | undefined): IProjectAssignment[] {
    return this.parseJsonArray<IProjectAssignment>(value || undefined)
      .map(item => ({
        atribuicao_id: Number(item.atribuicao_id),
        projeto_id: Number(item.projeto_id),
        descricao: (item.descricao || '').trim(),
        curso_ids: Array.isArray(item.curso_ids)
          ? item.curso_ids.filter(courseId => Number.isInteger(courseId) && courseId > 0)
          : []
      }))
      .filter(item => Number.isInteger(item.atribuicao_id) && Number.isInteger(item.projeto_id) && !!item.descricao)
  }

  private normalizeCourseLevel(
    rawLevel: IProjectDetailsCourse['level'],
    courseName: string
  ): ICourse['level'] {
    if (rawLevel === 'graduacao' || rawLevel === 'pos') {
      return rawLevel
    }

    return this.inferCourseLevel(courseName)
  }

  private normalizeUnitType(rawType?: string): IOrganizationalUnit['type'] {
    if (
      rawType === 'centro' ||
      rawType === 'escola' ||
      rawType === 'departamento' ||
      rawType === 'instituto'
    ) {
      return rawType
    }

    return 'centro'
  }

  private resolveExecutingUnit(
    unitName: string | undefined,
    units: IOrganizationalUnit[]
  ): IOrganizationalUnit | undefined {
    if (!unitName) return undefined

    const normalizedUnitName = this.normalizeText(unitName)
    const fromCatalog = units.find(unit => this.normalizeText(unit.name) === normalizedUnitName)

    if (fromCatalog) return fromCatalog

    return {
      id: -1,
      name: unitName,
      type: 'centro'
    }
  }

  private normalizeStatus(status?: string): IProject['status'] {
    if (status === 'draft' || status === 'published' || status === 'archived') {
      return status
    }
    return 'published'
  }

  private inferCourseLevel(courseName: string): ICourse['level'] {
    const normalizedName = this.normalizeText(courseName)
    const isPostGrad =
      normalizedName.includes('mestrado') ||
      normalizedName.includes('doutorado') ||
      normalizedName.includes('pos') ||
      normalizedName.includes('especializacao')

    return isPostGrad ? 'pos' : 'graduacao'
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
  }

  private extractDetail(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const detail = error.error?.detail
      if (typeof detail === 'string') {
        return detail
      }
    }

    return fallback
  }
}
