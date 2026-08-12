import { provideHttpClient } from '@angular/common/http'
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing'
import { TestBed } from '@angular/core/testing'

import { API_BASE_URL } from '../../global/constants/apiConfig'
import { AppToastService } from '../../global/services/toast/app-toast.service'
import { AdminService } from './admin.service'

describe('AdminService', () => {
  let service: AdminService
  let httpTesting: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AppToastService, useValue: { success: jasmine.createSpy(), error: jasmine.createSpy() } }
      ]
    })
    service = TestBed.inject(AdminService)
    httpTesting = TestBed.inject(HttpTestingController)
  })

  afterEach(() => httpTesting.verify())

  it('lists SIE sync runs with pagination and credentials', async () => {
    const result = service.listSyncRuns(2, 10)
    const request = httpTesting.expectOne(`${API_BASE_URL}/admin/sync-runs?page=2&page_size=10`)

    expect(request.request.method).toBe('GET')
    expect(request.request.withCredentials).toBeTrue()
    request.flush({
      message: 'Execuções de sincronização carregadas com sucesso.',
      data: {
        sync_runs: [{
          id: 1,
          source: 'sie',
          status: 'partial',
          is_complete: false,
          started_at: '2026-08-11T10:00:00Z',
          finished_at: '2026-08-11T10:01:00Z',
          page_size: 20,
          pages_processed: 2,
          rows_received: 40,
          projects_upserted: 3,
          participants_upserted: 7,
          error_summary: 'Uma página não foi processada.'
        }],
        pagination: { page: 2, page_size: 10, total: 11, total_pages: 2 }
      }
    })

    expect((await result)?.sync_runs[0].status).toBe('partial')
  })

  it('gets failures for a sync run instead of legacy import errors', async () => {
    const result = service.listSyncRunFailures(42)
    const request = httpTesting.expectOne(`${API_BASE_URL}/admin/sync-runs/42/failures?page=1&page_size=20`)

    expect(request.request.method).toBe('GET')
    expect(request.request.withCredentials).toBeTrue()
    request.flush({
      message: 'Falhas da sincronização carregadas com sucesso.',
      data: {
        failures: [{ sync_run_id: 42, error_summary: 'Resposta incompleta.', finished_at: null }],
        pagination: { page: 1, page_size: 20, total: 1, total_pages: 1 }
      }
    })

    expect((await result)?.failures[0].sync_run_id).toBe(42)
  })
})
