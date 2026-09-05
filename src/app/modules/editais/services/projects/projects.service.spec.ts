import { TestBed } from '@angular/core/testing'
import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { ProjectsService } from './projects.service'
import { AppToastService } from '../../../global/services/toast/app-toast.service'

describe('ProjectsService', () => {
  let service: ProjectsService
  let http: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppToastService, useValue: { error: jasmine.createSpy('error') } }
      ]
    })
    service = TestBed.inject(ProjectsService)
    http = TestBed.inject(HttpTestingController)
  })

  afterEach(() => http.verify())

  it('distinguishes an unavailable catalogue from an empty successful response', () => {
    service.listProjects({ search: '', areaIds: [], courseIds: [], centerIds: [], academicUnitIds: [], sort: 'recent' })
      .subscribe(response => expect(response.failed).toBeTrue())
    http.expectOne(request => request.url.endsWith('/projects')).flush({}, { status: 503, statusText: 'Unavailable' })

    service.listProjects({ search: '', areaIds: [], courseIds: [], centerIds: [], academicUnitIds: [], sort: 'recent' })
      .subscribe(response => {
        expect(response.failed).toBeUndefined()
        expect(response.projects).toEqual([])
      })
    http.expectOne(request => request.url.endsWith('/projects')).flush({
      data: { projetos: [], paginacao: { page: 1, page_size: 20, total: 0, total_pages: 0 } }
    })
  })

  it('uses the public catalog contract and only supported server filters', () => {
    service.listProjects({ search: 'sustentabilidade', areaIds: [3], courseIds: [8], centerIds: [5], academicUnitIds: [6], sort: 'alphabetical' }).subscribe(response => {
      expect(response.projects[0].institutional.status).toBe('Ativo')
      expect(response.pagination.total).toBe(1)
    })

    const request = http.expectOne(request => request.url.endsWith('/projects'))
    expect(request.request.params.get('q')).toBe('sustentabilidade')
    expect(request.request.params.getAll('centro_ids')).toEqual(['5'])
    expect(request.request.params.getAll('unidade_ids')).toEqual(['6'])
    expect(request.request.params.get('ordenacao')).toBe('titulo_asc')
    expect(request.request.params.has('deadline')).toBeFalse()
    expect(request.request.params.has('modality')).toBeFalse()
    request.flush({
      message: 'ok',
      data: {
        projetos: [{
          id: 1, sie_project_id: 101, process_code: null, title: 'Projeto', published_at: null,
          institutional: { summary: null, type: 'Pesquisa', status: 'Ativo', starts_at: null, ends_at: null, center: null, executing_unit: null },
          editorial: { short_description: null, description: null, areas: [], courses: [], cover: null },
          opportunities: []
        }],
        paginacao: { page: 1, page_size: 20, total: 1, total_pages: 1 }
      }
    })
  })

  it('loads catalogue options in pages of the backend-supported size', () => {
    let areas: unknown[] = []
    service.listAreas().subscribe(items => areas = items)

    const firstRequest = http.expectOne(request => request.url.endsWith('/catalogues/areas-tematicas') && request.params.get('offset') === '0')
    expect(firstRequest.request.params.get('limit')).toBe('50')
    firstRequest.flush({ message: 'ok', data: Array.from({ length: 50 }, (_, id) => ({ id, name: `Área ${id}`, slug: `area-${id}` })) })

    const secondRequest = http.expectOne(request => request.url.endsWith('/catalogues/areas-tematicas') && request.params.get('offset') === '50')
    secondRequest.flush({ message: 'ok', data: [{ id: 50, name: 'Área 50', slug: 'area-50' }] })

    expect(areas).toHaveSize(51)
  })
})
