import { TestBed, fakeAsync, tick } from '@angular/core/testing'
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { EditaisComponent } from './editais.component'
import { ProjectsService } from '../../services/projects/projects.service'
import { UsersService } from '../../../global/services/users/users.service'

describe('Catalogue navigation', () => {
  let projects: jasmine.SpyObj<ProjectsService>
  beforeEach(() => {
    projects = jasmine.createSpyObj('ProjectsService', ['listProjects', 'listAreas', 'listCenters', 'listUnits', 'listCourses', 'getProjectDetails'])
    projects.listProjects.and.returnValue(of({ projects: [], pagination: { page: 1, pageSize: 9, total: 0, totalPages: 1 } }))
    for (const method of ['listAreas', 'listCenters', 'listUnits', 'listCourses'] as const) projects[method].and.returnValue(of([]))
    TestBed.configureTestingModule({
      imports: [EditaisComponent],
      providers: [provideRouter([]), provideNoopAnimations(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ q: 'educação' }) } } },
        { provide: UsersService, useValue: { user$: of(null), initialized$: of(true) } },
        { provide: ProjectsService, useValue: projects }]
    })
  })

  it('loads the query passed by home and forwards it to the catalogue request', fakeAsync(() => {
    const fixture = TestBed.createComponent(EditaisComponent)
    fixture.detectChanges()
    tick(351)
    fixture.detectChanges()
    expect(projects.listProjects.calls.mostRecent().args[0].search).toBe('educação')
    expect(fixture.nativeElement.querySelector('input[type="search"]').value).toBe('educação')
  }))

  it('retries an unchanged query after failure and accepts a page-size change', fakeAsync(() => {
    projects.listProjects.and.returnValue(of({ failed: true, projects: [], pagination: { page: 1, pageSize: 9, total: 0, totalPages: 1 } }))
    const fixture = TestBed.createComponent(EditaisComponent)
    fixture.detectChanges()
    tick(351)
    fixture.detectChanges()
    expect(fixture.nativeElement.textContent).toContain('Não foi possível carregar os projetos')
    expect(fixture.nativeElement.textContent).not.toContain('0 projetos encontrados')
    fixture.nativeElement.querySelector('.portal-state button').click()
    tick(351)
    expect(projects.listProjects).toHaveBeenCalledTimes(2)
    fixture.componentInstance.onPageChange({ first: 0, rows: 6 })
    tick(351)
    expect(projects.listProjects.calls.mostRecent().args[2]).toBe(6)
  }))
})
