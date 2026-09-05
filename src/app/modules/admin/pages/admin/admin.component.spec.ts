import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { AdminComponent } from './admin.component'
import { AdminService } from '../../services/admin.service'
import { UsersService } from '../../../global/services/users/users.service'

describe('Administrative interface', () => {
  it('renders the API user and exposes all three administrative tabs', async () => {
    const pagination = { page: 1, page_size: 10, total: 1, total_pages: 1 }
    const user = { id: 1, institutional_email: 'fixture@example.invalid', full_name: 'Usuário de teste', role: 'admin', is_active: true, created_at: '2026-01-01', last_login_at: null }
    TestBed.configureTestingModule({
      imports: [AdminComponent],
      providers: [provideRouter([]), provideNoopAnimations(),
        { provide: UsersService, useValue: { user$: of({ user }), initialized$: of(true) } },
        { provide: AdminService, useValue: {
          getMetrics: () => Promise.resolve({ total_projects: 0, inactive_projects: 0, total_users: 1, active_users: 1 }),
          listUsers: () => Promise.resolve({ users: [user], pagination }),
          listProjects: () => Promise.resolve({ projects: [], pagination }),
          listSyncRuns: () => Promise.resolve({ sync_runs: [], pagination })
        } }]
    })
    const fixture = TestBed.createComponent(AdminComponent)
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain(user.institutional_email)
    expect(fixture.nativeElement.textContent).toContain(user.full_name)
    const tabs = [...fixture.nativeElement.querySelectorAll('[role="tab"]')] as HTMLElement[]
    expect(tabs.map(tab => tab.textContent?.trim())).toEqual(['Usuários', 'Projetos', 'Sincronizações'])
    tabs[1].click()
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Nenhum projeto encontrado')
    tabs[2].click()
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Nenhuma execução de sincronização encontrada')
  })
})
