import { TestBed } from '@angular/core/testing'
import { provideRouter, Router } from '@angular/router'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { BehaviorSubject, of } from 'rxjs'
import { HomeComponent } from './home.component'
import { UsersService } from '../../services/users/users.service'
import { ISigninData } from '../../interfaces/ISignin'
import { ProjectsService } from '../../../editais/services/projects/projects.service'
import { IProject } from '../../../editais/interfaces/IProject'

describe('Home discovery flow', () => {
  const project: IProject = {
    id: 42, sie_project_id: 42, title: 'Projeto de teste', process_code: null, published_at: null, contacts: [],
    institutional: { summary: 'Resumo fornecido pela API de teste.', type: 'Pesquisa', status: null, starts_at: null, ends_at: null, center: null, executing_unit: null },
    editorial: { short_description: null, description: null, areas: [], courses: [], cover: null }, opportunities: []
  }
  let user: BehaviorSubject<ISigninData | null>
  let projects: jasmine.SpyObj<ProjectsService>
  beforeEach(() => {
    user = new BehaviorSubject<ISigninData | null>(null)
    projects = jasmine.createSpyObj('ProjectsService', ['listProjects'])
    projects.listProjects.and.returnValue(of({ projects: [project], pagination: { page: 1, pageSize: 3, total: 1, totalPages: 1 } }))
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), provideNoopAnimations(),
        { provide: UsersService, useValue: { user$: user, initialized$: of(true) } },
        { provide: ProjectsService, useValue: projects }]
    })
  })

  it('shows API projects and routes their action to the matching detail, without a fake cover', () => {
    const fixture = TestBed.createComponent(HomeComponent)
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain(project.title)
    expect(fixture.nativeElement.querySelector('.edital-card__cover')).toBeNull()
    fixture.nativeElement.querySelector('.publication-list__action').click()
    expect(navigate).toHaveBeenCalledWith(['/catalogo'], { queryParams: { projeto: 42 } })
  })

  it('submits a trimmed search from the home form', () => {
    const fixture = TestBed.createComponent(HomeComponent)
    const navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true)
    fixture.detectChanges()
    fixture.componentInstance.search = '  pesquisa  '
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(navigate).toHaveBeenCalledWith(['/catalogo'], { queryParams: { q: 'pesquisa' } })
  })

  it('offers a retry for unavailable data instead of reporting no projects', () => {
    projects.listProjects.and.returnValue(of({ failed: true, projects: [], pagination: { page: 1, pageSize: 3, total: 0, totalPages: 1 } }))
    const fixture = TestBed.createComponent(HomeComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Consulta temporariamente indisponível')
    expect(fixture.componentInstance.total).toBeNull()
    projects.listProjects.and.returnValue(of({ projects: [project], pagination: { page: 1, pageSize: 3, total: 1, totalPages: 1 } }))
    fixture.nativeElement.querySelector('.home-notice button').click()
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain(project.title)
    expect(fixture.nativeElement.querySelector('.home-notice')).toBeNull()
  })

  it('only exposes management shortcuts to authorized profiles', () => {
    const fixture = TestBed.createComponent(HomeComponent)
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('a[href="/admin"]')).toBeNull()
    expect(fixture.nativeElement.querySelector('a[href="/my-projects"]')).toBeNull()
    user.next({ user: { id: 1, full_name: 'Teste Admin', institutional_email: 'teste@example.invalid', role: 'admin', is_active: true } })
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('a[href="/admin"]')).not.toBeNull()
    expect(fixture.nativeElement.querySelector('a[href="/my-projects"]')).not.toBeNull()
  })
})
