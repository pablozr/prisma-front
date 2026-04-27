import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { Observable, catchError, delay, forkJoin, map, of, shareReplay, throwError } from 'rxjs'
import {
  ICourse,
  IEmailDispatch,
  IOrganizationalUnit,
  IProfessor,
  IProject,
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
  short_name?: string
}

interface IProjectsListItem {
  id: number
  title: string
  short_description?: string
  full_description?: string
  owner_professor_name?: string
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
}

interface IProjectsListPayload {
  projetos: IProjectsListItem[]
  paginacao: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
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
  cursos: IProjectDetailsCourse[] | string
  imagens: IProjectDetailsImage[] | string
}

interface IProjectDetailsPayload {
  projeto: IProjectDetails
}

type IProjectsApiSort = 'titulo_asc' | 'titulo_desc' | 'data_desc'

const EDITAIS_ROUTES = {
  listProjects: `${API_BASE_URL}/projects`,
  projectDetails: (projectId: number) => `${API_BASE_URL}/projects/${projectId}`,
  listAreas: `${API_BASE_URL}/catalogues/areas-tematicas`,
  listUnits: `${API_BASE_URL}/catalogues/centros`
} as const

@Injectable({ providedIn: 'root' })
export class ProjectsService {
  private http = inject(HttpClient)
  private toast = inject(AppToastService)
  private readonly projectDetailsCache = new Map<number, Observable<IProjectDetailsPayload['projeto']>>()

  private readonly catalogueParams = new HttpParams({
    fromObject: {
      limit: '200',
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
      catchError((err: unknown) => {
        this.toast.error(
          'Falha ao carregar áreas',
          this.extractDetail(err, 'Nao foi possivel carregar as áreas temáticas.')
        )
        return of([])
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    )

  private readonly unitsCache$ = this.http
    .get<IApiResponse<IUnitsCatalogueItem[]>>(EDITAIS_ROUTES.listUnits, {
      params: this.catalogueParams
    })
    .pipe(
      map(res =>
        (res?.data || []).map(unit => ({
          id: unit.id,
          name: unit.name,
          short_name: unit.short_name,
          type: 'centro' as const
        }))
      ),
      catchError((err: unknown) => {
        this.toast.error(
          'Falha ao carregar unidades',
          this.extractDetail(err, 'Nao foi possivel carregar os centros da UNIRIO.')
        )
        return of([])
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    )

  listProjects(filters?: IProjectFilters): Observable<IProject[]> {
    const params = this.buildProjectsParams(filters)

    return forkJoin({
      areas: this.listAreas(),
      units: this.listUnits(),
      projectsResponse: this.http.get<IApiResponse<IProjectsListPayload>>(EDITAIS_ROUTES.listProjects, {
        params
      })
    }).pipe(
      map(({ areas, units, projectsResponse }) => {
        const summaries = projectsResponse?.data?.projetos || []
        return this.mapSummariesToProjects(summaries, areas, units)
      }),
      catchError((err: unknown) => {
        this.toast.error(
          'Falha ao carregar editais',
          this.extractDetail(err, 'Nao foi possivel carregar a lista de editais.')
        )
        return of([])
      })
    )
  }

  listUnits(): Observable<IOrganizationalUnit[]> {
    return this.unitsCache$
  }

  listAreas(): Observable<IProjectArea[]> {
    return this.areasCache$
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

  sendEmail(dispatch: IEmailDispatch): Observable<{ success: true; id: string }> {
    const id = `mock-${Date.now()}`
    return of({ success: true as const, id }).pipe(delay(800))
  }

  private fetchProjectDetails(projectId: number): Observable<IProjectDetailsPayload['projeto']> {
    const cachedRequest = this.projectDetailsCache.get(projectId)
    if (cachedRequest) return cachedRequest

    const request$ = this.http
      .get<IApiResponse<IProjectDetailsPayload>>(EDITAIS_ROUTES.projectDetails(projectId))
      .pipe(
        map(response => {
          const project = response?.data?.projeto
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

  private buildProjectsParams(filters?: IProjectFilters): HttpParams {
    let params = new HttpParams({
      fromObject: {
        page: '1',
        page_size: '100',
        somente_habilitados: 'true'
      }
    })

    const search = filters?.search?.trim()
    if (search) {
      params = params.set('q', search)
    }

    params = this.appendArrayQueryParam(params, 'area_ids', filters?.areaIds)
    params = this.appendArrayQueryParam(params, 'unidade_ids', filters?.unitIds)
    params = this.appendArrayQueryParam(params, 'curso_ids', filters?.courseIds)

    const apiSort = this.mapSortToApi(filters?.sort)
    if (apiSort) {
      params = params.set('ordenacao', apiSort)
    }

    return params
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

  private mapSummariesToProjects(
    summaries: IProjectsListItem[],
    areas: IProjectArea[],
    units: IOrganizationalUnit[]
  ): IProject[] {
    const areasById = new Map(areas.map(area => [area.id, area]))

    return summaries.map(summary => {
      const mappedAreas = summary.area_ids.map(areaId => {
        const area = areasById.get(areaId)
        if (area) return area

        return {
          id: areaId,
          name: `Área #${areaId}`,
          slug: `area-${areaId}`
        }
      })

      const mappedCourses: ICourse[] = summary.course_ids.map(courseId => ({
        id: courseId,
        name: `Curso #${courseId}`,
        level: 'graduacao'
      }))

      const ownerProfessor: IProfessor = {
        id: 0,
        full_name: summary.owner_professor_name || 'Professor(a) nao informado(a)',
        institutional_email: ''
      }

      const executingUnit = this.resolveExecutingUnit(summary.executing_unit_name, units)

      return {
        id: summary.id,
        process_code: summary.process_code,
        title: summary.title,
        short_description: summary.short_description,
        full_description: summary.full_description,
        contact_email: '',
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
        vacancies: summary.vacancies,
        weekly_hours: summary.weekly_hours,
        modality: summary.modality
      }
    })
  }

  private mergeDetails(project: IProject, details: IProjectDetailsPayload['projeto']): IProject {
    const images = this.parseJsonArray<IProjectDetailsImage>(details.imagens)
    const cover = images.find(image => image.image_type === 'cover')

    const areas = this.parseJsonArray<IProjectDetailsArea>(details.areas).map(area => ({
      id: area.id,
      name: area.name,
      slug: area.slug
    }))

    const courses: ICourse[] = this.parseJsonArray<IProjectDetailsCourse>(details.cursos).map(
      course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        level: this.normalizeCourseLevel(course.level, course.name),
        unit_id: course.unit_id
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
    if (rawType === 'centro' || rawType === 'departamento' || rawType === 'instituto') {
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
