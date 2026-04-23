import { Component, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HeaderComponent } from '../../../global/components/header/header.component'
import {
  BreadcrumbsComponent,
  IBreadcrumbItem
} from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { EditalCardComponent } from '../../components/edital-card/edital-card.component'
import { EditalFiltersComponent } from '../../components/edital-filters/edital-filters.component'
import { EmailDialogComponent } from '../../components/email-dialog/email-dialog.component'
import { DetailsDialogComponent } from '../../components/details-dialog/details-dialog.component'
import { ProjectsService } from '../../services/projects/projects.service'
import {
  ICourse,
  IOrganizationalUnit,
  IProject,
  IProjectArea,
  IProjectFilters
} from '../../interfaces/IProject'

@Component({
  selector: 'app-editais',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    BreadcrumbsComponent,
    EditalCardComponent,
    EditalFiltersComponent,
    EmailDialogComponent,
    DetailsDialogComponent
  ],
  templateUrl: './editais.component.html',
  styleUrl: './editais.component.scss'
})
export class EditaisComponent implements OnInit {
  private projectsService = inject(ProjectsService)

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', route: '/home', icon: 'pi pi-home' },
    { label: 'Editais abertos', icon: 'pi pi-file' }
  ]

  allProjects: IProject[] = []
  filteredProjects: IProject[] = []

  areas: IProjectArea[] = []
  courses: ICourse[] = []
  units: IOrganizationalUnit[] = []

  loading = true

  filters: IProjectFilters = this.defaultFilters()

  emailDialogVisible = false
  emailProject: IProject | null = null

  detailsDialogVisible = false
  detailsProject: IProject | null = null

  ngOnInit() {
    this.areas = this.projectsService.listAreas()
    this.courses = this.projectsService.listCourses()
    this.units = this.projectsService.listUnits()

    this.projectsService.listProjects().subscribe(list => {
      this.allProjects = list
      this.applyFilters()
      this.loading = false
    })
  }

  private defaultFilters(): IProjectFilters {
    return {
      search: '',
      areaIds: [],
      courseIds: [],
      unitIds: [],
      modality: null,
      deadline: null,
      level: null,
      sort: 'recent'
    }
  }

  onFiltersChange(next: IProjectFilters) {
    this.filters = next
    this.applyFilters()
  }

  onReset() {
    this.filters = this.defaultFilters()
    this.applyFilters()
  }

  openContact(project: IProject) {
    this.emailProject = project
    this.emailDialogVisible = true
  }

  onDetails(project: IProject) {
    this.detailsProject = project
    this.detailsDialogVisible = true
  }

  onDetailsContact(project: IProject) {
    this.detailsDialogVisible = false
    this.openContact(project)
  }

  private applyFilters() {
    const { search, areaIds, courseIds, unitIds, modality, deadline, level, sort } = this.filters
    const term = search.trim().toLowerCase()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const byState = (p: IProject): IProjectFilters['deadline'] => {
      if (!p.ends_at) return 'open'
      const end = new Date(p.ends_at)
      if (end < today) return 'closed'
      const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays <= 7) return 'closing_soon'
      return 'open'
    }

    let list = this.allProjects.filter(p => p.status === 'published' && p.is_active)

    if (term) {
      list = list.filter(p => {
        const haystack = [
          p.title,
          p.short_description || '',
          p.full_description || '',
          p.process_code || '',
          p.owner_professor.full_name,
          p.owner_professor.institutional_email
        ]
          .join(' ')
          .toLowerCase()
        return haystack.includes(term)
      })
    }

    if (areaIds.length) {
      list = list.filter(p => p.areas.some(a => areaIds.includes(a.id)))
    }

    if (courseIds.length) {
      list = list.filter(p => p.courses.some(c => courseIds.includes(c.id)))
    }

    if (unitIds.length) {
      list = list.filter(p =>
        p.executing_unit ? unitIds.includes(p.executing_unit.id) : false
      )
    }

    if (modality) {
      list = list.filter(p => p.modality === modality)
    }

    if (level) {
      list = list.filter(p => p.courses.some(c => c.level === level))
    }

    if (deadline) {
      list = list.filter(p => byState(p) === deadline)
    }

    list = [...list].sort((a, b) => {
      if (sort === 'alphabetical') return a.title.localeCompare(b.title, 'pt-BR')
      if (sort === 'deadline') {
        const ea = a.ends_at ? new Date(a.ends_at).getTime() : Number.POSITIVE_INFINITY
        const eb = b.ends_at ? new Date(b.ends_at).getTime() : Number.POSITIVE_INFINITY
        return ea - eb
      }
      const pa = a.published_at ? new Date(a.published_at).getTime() : 0
      const pb = b.published_at ? new Date(b.published_at).getTime() : 0
      return pb - pa
    })

    this.filteredProjects = list
  }
}
