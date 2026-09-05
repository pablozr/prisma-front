import { Injectable, inject } from '@angular/core'
import { HttpClient, HttpParams } from '@angular/common/http'
import { EMPTY, Observable, catchError, expand, map, of, reduce, shareReplay, throwError } from 'rxjs'
import { ICourse, IOrganizationalUnit, IProject, IProjectArea, IProjectFilters } from '../../interfaces/IProject'
import { API_BASE_URL } from '../../../global/constants/apiConfig'
import { AppToastService } from '../../../global/services/toast/app-toast.service'
import { extractHttpErrorDetail } from '../../../global/utils/http.utils'

interface IApiResponse<TData> {
  message: string
  data: TData
}

interface IProjectsListPayload {
  projetos: IProject[]
  paginacao: {
    page: number
    page_size: number
    total: number
    total_pages: number
  }
}

interface IProjectDetailsPayload {
  projeto: IProject
}

interface IAreaCatalogueItem {
  id: number
  name: string
  slug: string
}

interface IUnitCatalogueItem {
  id: number
  name: string
  unit_type?: IOrganizationalUnit['unit_type']
  type?: string
  parent_unit_id?: number | null
}

interface ICourseCatalogueItem {
  id: number
  name: string
  code: string | null
  offering_unit: IOrganizationalUnit | null
}

export interface IProjectsPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface IProjectsListResponse {
  failed?: boolean
  projects: IProject[]
  pagination: IProjectsPagination
}

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
  private readonly projectDetailsCache = new Map<number, Observable<IProject>>()
  private readonly cataloguePageSize = 50

  listProjects(filters: IProjectFilters, page = 1, pageSize = 20, notifyError = true): Observable<IProjectsListResponse> {
    return this.http
      .get<IApiResponse<IProjectsListPayload>>(EDITAIS_ROUTES.listProjects, {
        params: this.buildProjectsParams(filters, page, pageSize)
      })
      .pipe(
        map(({ data }) => ({
          projects: data.projetos,
          pagination: {
            page: data.paginacao.page,
            pageSize: data.paginacao.page_size,
            total: data.paginacao.total,
            totalPages: data.paginacao.total_pages
          }
        })),
        catchError(error => {
          if (notifyError) this.toast.error('Falha ao carregar projetos', this.extractDetail(error, 'Não foi possível carregar o catálogo de projetos.'))
          return of({ failed: true, projects: [], pagination: { page, pageSize, total: 0, totalPages: 1 } })
        })
      )
  }

  getProjectDetails(projectId: number): Observable<IProject> {
    const cached = this.projectDetailsCache.get(projectId)
    if (cached) return cached

    const request$ = this.http.get<IApiResponse<IProjectDetailsPayload>>(EDITAIS_ROUTES.projectDetails(projectId)).pipe(
      map(({ data }) => data.projeto),
      catchError(error => {
        this.projectDetailsCache.delete(projectId)
        return throwError(() => error)
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    )
    this.projectDetailsCache.set(projectId, request$)
    return request$
  }

  listAreas(): Observable<IProjectArea[]> {
    return this.listCatalogue<IAreaCatalogueItem>(EDITAIS_ROUTES.listAreas).pipe(
      catchError(() => of([]))
    )
  }

  listUnits(): Observable<IOrganizationalUnit[]> {
    return this.listCatalogue<IUnitCatalogueItem>(EDITAIS_ROUTES.listUnits).pipe(
      map(data => data.map(unit => ({
        id: unit.id,
        name: unit.name,
        unit_type: unit.unit_type || (unit.type === 'centro' ? 'centro' : 'unidade'),
        parent_unit_id: unit.parent_unit_id ?? null
      }))),
      catchError(() => of([]))
    )
  }

  listCenters(): Observable<IOrganizationalUnit[]> {
    return this.listCatalogue<IUnitCatalogueItem>(EDITAIS_ROUTES.listCenters).pipe(
      map(data => data.map(center => ({ id: center.id, name: center.name, unit_type: 'centro' as const, parent_unit_id: null }))),
      catchError(() => of([]))
    )
  }

  listCourses(): Observable<ICourse[]> {
    return this.listCatalogue<ICourseCatalogueItem>(EDITAIS_ROUTES.listCourses).pipe(
      catchError(() => of([]))
    )
  }

  private listCatalogue<T>(url: string): Observable<T[]> {
    const page = (offset: number) => this.http
      .get<IApiResponse<T[]>>(url, { params: new HttpParams({ fromObject: { limit: String(this.cataloguePageSize), offset: String(offset) } }) })
      .pipe(map(({ data }) => data))

    return page(0).pipe(
      expand((items, pageIndex) => items.length === this.cataloguePageSize ? page((pageIndex + 1) * this.cataloguePageSize) : EMPTY),
      reduce((allItems, items) => [...allItems, ...items], [] as T[])
    )
  }

  private buildProjectsParams(filters: IProjectFilters, page: number, pageSize: number): HttpParams {
    let params = new HttpParams({
      fromObject: { page: String(page), page_size: String(pageSize), somente_habilitados: 'true' }
    })
    const search = filters.search.trim()
    if (search) params = params.set('q', search)
    params = this.appendArrayQueryParam(params, 'area_ids', filters.areaIds)
    params = this.appendArrayQueryParam(params, 'centro_ids', filters.centerIds)
    params = this.appendArrayQueryParam(params, 'unidade_ids', filters.academicUnitIds)
    params = this.appendArrayQueryParam(params, 'curso_ids', filters.courseIds)
    if (filters.sort === 'alphabetical') params = params.set('ordenacao', 'titulo_asc')
    return params
  }

  private appendArrayQueryParam(params: HttpParams, key: string, values: number[]): HttpParams {
    return [...new Set(values.filter(value => Number.isInteger(value) && value > 0))]
      .sort((a, b) => a - b)
      .reduce((next, value) => next.append(key, String(value)), params)
  }

  private extractDetail(error: unknown, fallback: string): string {
    return extractHttpErrorDetail(error, fallback)
  }
}
