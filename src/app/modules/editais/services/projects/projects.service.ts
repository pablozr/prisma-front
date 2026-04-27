import { Injectable } from '@angular/core'
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { Observable, catchError, delay, forkJoin, map, of, shareReplay, throwError } from 'rxjs'
import {
  ICourse,
  IEmailDispatch,
  IOrganizationalUnit,
  IProfessor,
  IProject,
  IProjectArea
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

interface IProjectDetailsPayload {
  projeto: {
    id: number
    title: string
    full_description?: string
    areas: Array<{ id: number; name: string; slug: string }>
    cursos: Array<{ id: number; name: string; unit_id?: number }>
    imagens: Array<{ id: number; image_type: 'cover' | 'gallery'; image_url: string }>
  }
}

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

  listProjects(): Observable<IProject[]> {
    const params = new HttpParams({
      fromObject: {
        page: '1',
        page_size: '100',
        somente_habilitados: 'true'
      }
    })

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
    const cover = details.imagens.find(image => image.image_type === 'cover')

    const courses: ICourse[] = (details.cursos || []).map(course => ({
      id: course.id,
      name: course.name,
      level: this.inferCourseLevel(course.name),
      unit_id: course.unit_id
    }))

    return {
      ...project,
      title: details.title || project.title,
      full_description: details.full_description || project.full_description,
      areas: (details.areas || []).map(area => ({
        id: area.id,
        name: area.name,
        slug: area.slug
      })),
      courses: courses.length ? courses : project.courses,
      cover: cover
        ? {
            id: cover.id,
            image_type: cover.image_type,
            image_url: cover.image_url
          }
        : project.cover
    }
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
