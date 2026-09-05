import { TestBed } from '@angular/core/testing'
import { provideRouter } from '@angular/router'
import { provideNoopAnimations } from '@angular/platform-browser/animations'
import { of } from 'rxjs'
import { ProfessorProjectsComponent } from './professor-projects.component'
import { ProfessorProjectsService } from '../../services/professor-projects/professor-projects.service'
import { UsersService } from '../../../global/services/users/users.service'
import { AppToastService } from '../../../global/services/toast/app-toast.service'
import { IManagedProject } from '../../interfaces/IProfessorProject'

describe('Project management interface', () => {
  it('submits a search and opens the editor with correctly associated field labels', async () => {
    const project: IManagedProject = {
      id: 1, sie_project_id: 1, process_code: null, title: 'Projeto de teste', published_at: null,
      institutional: { summary: null, type: null, status: null, starts_at: null, ends_at: null, center: null, executing_unit: null },
      editorial: { short_description: null, description: null, areas: [], courses: [], cover: null }, opportunities: [],
      access: { can_edit: true, role: 'professor' }
    }
    const service = jasmine.createSpyObj('ProfessorProjectsService', ['listMyProjects', 'getMyProject'])
    service.listMyProjects.and.returnValue(of({ projects: [project], pagination: { page: 1, page_size: 10, total: 1, total_pages: 1 } }))
    service.getMyProject.and.returnValue(of(project))
    TestBed.configureTestingModule({
      imports: [ProfessorProjectsComponent],
      providers: [provideRouter([]), provideNoopAnimations(),
        { provide: UsersService, useValue: { user$: of(null), initialized$: of(true) } },
        { provide: ProfessorProjectsService, useValue: service },
        { provide: AppToastService, useValue: { error: jasmine.createSpy(), success: jasmine.createSpy() } }]
    })
    const fixture = TestBed.createComponent(ProfessorProjectsComponent)
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.componentInstance.search = 'tema de teste'
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    expect(service.listMyProjects.calls.mostRecent().args[2]).toBe('tema de teste')
    const manage = [...fixture.nativeElement.querySelectorAll('button')].find((button: any) => button.textContent.trim() === 'Gerenciar') as HTMLButtonElement
    manage.click()
    fixture.detectChanges()
    await fixture.whenStable()
    fixture.detectChanges()
    expect(service.getMyProject).toHaveBeenCalledWith(1)
    expect(document.querySelector('label[for="project-short-description"]')).not.toBeNull()
    expect(document.querySelector('#project-short-description')).not.toBeNull()
    expect(document.querySelector('label[for="project-cover"]')).not.toBeNull()
    const description = document.querySelector('#project-short-description') as HTMLTextAreaElement
    description.value = 'Uma descrição ainda não salva'
    description.dispatchEvent(new Event('input', { bubbles: true }))
    fixture.detectChanges()
    const sectionButton = (label: string) => Array.from(document.querySelectorAll<HTMLButtonElement>('.professor-manager__nav button')).find(button => button.textContent!.trim() === label)!
    sectionButton('Capa').click()
    fixture.detectChanges()
    expect((document.querySelector('#manager-content') as HTMLElement).hidden).toBeTrue()
    expect((document.querySelector('#manager-cover') as HTMLElement).hidden).toBeFalse()
    sectionButton('Conteúdo').click()
    fixture.detectChanges()
    await fixture.whenStable()
    expect(description.value).toBe('Uma descrição ainda não salva')
    expect(sectionButton('Conteúdo').getAttribute('aria-pressed')).toBe('true')
    fixture.componentInstance.closeManager()
    fixture.detectChanges()
  })
})
