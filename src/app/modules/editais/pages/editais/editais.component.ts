import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HeaderComponent } from '../../../global/components/header/header.component'
import {
  BreadcrumbsComponent,
  IBreadcrumbItem
} from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { EditalCardComponent } from '../../components/edital-card/edital-card.component'
import { EditalFiltersComponent } from '../../components/edital-filters/edital-filters.component'
import { DetailsDialogComponent } from '../../components/details-dialog/details-dialog.component'
import {
  IProjectsListResponse,
  ProjectsService
} from '../../services/projects/projects.service'
import {
  ICourse,
  IOrganizationalUnit,
  IProject,
  IProjectArea,
  IProjectFilters
} from '../../interfaces/IProject'
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  switchMap
} from 'rxjs'

interface IProjectsQueryState {
  filters: IProjectFilters
  page: number
}

@Component({
  selector: 'app-editais',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    BreadcrumbsComponent,
    EditalCardComponent,
    EditalFiltersComponent,
    DetailsDialogComponent
  ],
  templateUrl: './editais.component.html',
  styleUrl: './editais.component.scss'
})
export class EditaisComponent implements OnInit, OnDestroy {
  private projectsService = inject(ProjectsService)
  private initialLoadSubscription?: Subscription
  private initialProjectsSubscription?: Subscription
  private detailsLoadSubscription?: Subscription
  private filtersSubscription?: Subscription
  private readonly filtersUpdates$ = new Subject<IProjectsQueryState>()

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', route: '/home', icon: 'pi pi-home' },
    { label: 'Projetos vigentes', icon: 'pi pi-file' }
  ]

  allProjects: IProject[] = []
  filteredProjects: IProject[] = []

  areas: IProjectArea[] = []
  courses: ICourse[] = []
  units: IOrganizationalUnit[] = []
  private allCourses: ICourse[] = []
  private searchIndexByProjectId = new Map<number, string>()

  loading = true

  readonly pageSize = 20
  currentPage = 1
  totalPages = 1
  totalProjects = 0

  filters: IProjectFilters = this.defaultFilters()

  detailsDialogVisible = false
  detailsProject: IProject | null = null

  ngOnInit() {
    this.startFiltersSync()

    this.initialProjectsSubscription = this.projectsService
      .listProjects(this.filters, this.currentPage, this.pageSize)
      .subscribe(response => {
        this.applyProjectsPage(response)
        this.loading = false
      })

    this.initialLoadSubscription = forkJoin({
      areas: this.projectsService.listAreas(),
      units: this.projectsService.listUnits(),
      courses: this.projectsService.listCourses()
    }).subscribe(({ areas, units, courses }) => {
      this.areas = areas
      this.units = units
      this.allCourses = courses
      this.applyProjects(this.allProjects)
    })
  }

  ngOnDestroy() {
    this.initialLoadSubscription?.unsubscribe()
    this.initialProjectsSubscription?.unsubscribe()
    this.detailsLoadSubscription?.unsubscribe()
    this.filtersSubscription?.unsubscribe()
    this.filtersUpdates$.complete()
  }

  private defaultFilters(): IProjectFilters {
    return {
      search: '',
      areaIds: [],
      courseIds: [],
      centerIds: [],
      academicUnitIds: [],
      modality: null,
      deadline: null,
      level: null,
      sort: 'recent'
    }
  }

  onFiltersChange(next: IProjectFilters) {
    this.filters = this.normalizeHierarchyFilters(this.cloneFilters(next))
    this.refreshCourseOptions()
    this.refreshProjects(true)
  }

  onReset() {
    this.filters = this.defaultFilters()
    this.refreshCourseOptions()
    this.refreshProjects(true)
  }

  get visiblePages(): number[] {
    if (this.totalPages <= 1) {
      return []
    }

    const radius = 2
    const start = Math.max(1, this.currentPage - radius)
    const end = Math.min(this.totalPages, this.currentPage + radius)
    const pages: number[] = []

    for (let page = start; page <= end; page++) {
      pages.push(page)
    }

    return pages
  }

  get showLeadingEllipsis(): boolean {
    return this.visiblePages.length > 0 && this.visiblePages[0] > 2
  }

  get showTrailingEllipsis(): boolean {
    return (
      this.visiblePages.length > 0 && this.visiblePages[this.visiblePages.length - 1] < this.totalPages - 1
    )
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return
    }

    this.currentPage = page
    this.refreshProjects()
  }

  openContact(project: IProject) {
    const contactEmail =
      project.contact_email?.trim() ||
      project.responsible_person.institutional_email?.trim()
    if (!contactEmail) return

    const subject = encodeURIComponent(`[SIEPA] Interesse no projeto ${project.process_code || ''}`.trim())
    const body = encodeURIComponent(
      `Ola, tenho interesse no projeto \"${project.title}\" e gostaria de mais informacoes.`
    )
    window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
  }

  onDetails(project: IProject) {
    this.detailsProject = project
    this.detailsDialogVisible = true

    this.detailsLoadSubscription?.unsubscribe()
    const selectedProjectId = project.id

    this.detailsLoadSubscription = this.projectsService
      .getProjectDetails(project)
      .subscribe(detailedProject => {
        if (!this.detailsProject || this.detailsProject.id !== selectedProjectId) return

        this.detailsProject = detailedProject
        this.replaceProject(detailedProject)
      })
  }

  onDetailsContact(project: IProject) {
    this.openContact(project)
  }

  onDetailsDialogVisibleChange(visible: boolean) {
    this.detailsDialogVisible = visible

    if (!visible) {
      this.detailsProject = null
    }
  }

  private applyFilters() {
    const { search, areaIds, courseIds, centerIds, academicUnitIds, modality, deadline, level, sort } =
      this.filters
    const term = search.trim().toLowerCase()
    const today = new Date()
    const unitsById = this.getUnitsByIdMap()
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
      list = list.filter(project =>
        (this.searchIndexByProjectId.get(project.id) || '').includes(term)
      )
    }

    if (areaIds.length) {
      list = list.filter(p => p.areas.some(a => areaIds.includes(a.id)))
    }

    if (courseIds.length) {
      list = list.filter(p => p.courses.some(c => courseIds.includes(c.id)))
    }

    if (centerIds.length || academicUnitIds.length) {
      list = list.filter(project =>
        this.matchesUnitFilters(project, centerIds, academicUnitIds, unitsById)
      )
    }

    const hasModalityData = list.some(p => !!p.modality)
    if (modality && hasModalityData) {
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

  private extractCourses(projects: IProject[]): ICourse[] {
    const byId = new Map<number, ICourse>()

    for (const project of projects) {
      for (const course of project.courses) {
        if (!byId.has(course.id)) {
          byId.set(course.id, course)
        }
      }
    }

    return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }

  private replaceProject(nextProject: IProject) {
    this.allProjects = this.allProjects.map(project =>
      project.id === nextProject.id ? nextProject : project
    )
    this.rebuildSearchIndex(this.allProjects)
    if (!this.allCourses.length) {
      this.allCourses = this.extractCourses(this.allProjects)
    }
    this.refreshCourseOptions()
    this.applyFilters()
  }

  private refreshProjects(resetPage = false) {
    if (resetPage) {
      this.currentPage = 1
    }

    this.filtersUpdates$.next({
      filters: this.cloneFilters(this.filters),
      page: this.currentPage
    })
  }

  private startFiltersSync() {
    this.filtersSubscription = this.filtersUpdates$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(
          (prev, next) => prev.page === next.page && this.areFiltersEqual(prev.filters, next.filters)
        ),
        switchMap(query => {
          this.loading = true
          return this.projectsService.listProjects(query.filters, query.page, this.pageSize)
        })
      )
      .subscribe(response => {
        this.applyProjectsPage(response)
        this.loading = false
      })
  }

  private applyProjectsPage(response: IProjectsListResponse) {
    this.currentPage = response.pagination.page
    this.totalPages = Math.max(1, response.pagination.totalPages)
    this.totalProjects = response.pagination.total
    this.applyProjects(response.projects)
  }

  private applyProjects(projects: IProject[]) {
    this.allProjects = this.projectsService.enrichProjectsWithCatalogData(projects)
    this.rebuildSearchIndex(this.allProjects)
    if (!this.allCourses.length) {
      this.allCourses = this.extractCourses(this.allProjects)
    }
    this.refreshCourseOptions()
    this.applyFilters()
  }

  private rebuildSearchIndex(projects: IProject[]) {
    const nextIndex = new Map<number, string>()

    for (const project of projects) {
      const haystack = [
        project.title,
        project.short_description || '',
        project.process_code || '',
        project.responsible_person.full_name,
        project.responsible_person.institutional_email || '',
        project.executing_unit?.name || '',
        project.executing_unit?.short_name || ''
      ]
        .join(' ')
        .toLowerCase()

      nextIndex.set(project.id, haystack)
    }

    this.searchIndexByProjectId = nextIndex
  }

  private refreshCourseOptions() {
    this.courses = this.getAvailableCourses(this.filters)
  }

  private normalizeHierarchyFilters(filters: IProjectFilters): IProjectFilters {
    const unitsById = this.getUnitsByIdMap()
    const selectedCenters = new Set(filters.centerIds)

    const academicUnitIds = filters.academicUnitIds.filter(academicUnitId => {
      if (!selectedCenters.size) {
        return true
      }

      return this.isDescendantOfCenter(academicUnitId, selectedCenters, unitsById)
    })

    const availableCourseIds = new Set(
      this.getAvailableCourses({ ...filters, academicUnitIds }).map(course => course.id)
    )

    const courseIds = filters.courseIds.filter(courseId => availableCourseIds.has(courseId))

    return {
      ...filters,
      academicUnitIds,
      courseIds
    }
  }

  private getAvailableCourses(filters: IProjectFilters): ICourse[] {
    const sourceCourses = this.allCourses.length ? this.allCourses : this.extractCourses(this.allProjects)
    if (!sourceCourses.length) {
      return []
    }

    if (!filters.centerIds.length && !filters.academicUnitIds.length) {
      return sourceCourses
    }

    const unitsById = this.getUnitsByIdMap()
    const selectedCenters = new Set(filters.centerIds)
    const selectedAcademicUnits = new Set(filters.academicUnitIds)

    return sourceCourses.filter(course => {
      if (!course.unit_id) {
        return false
      }

      if (selectedAcademicUnits.size) {
        const academicUnitId = this.resolveAcademicUnitId(course.unit_id, unitsById)
        return academicUnitId !== null && selectedAcademicUnits.has(academicUnitId)
      }

      const centerId = this.resolveCenterIdFromUnit(course.unit_id, unitsById)
      return centerId !== null && selectedCenters.has(centerId)
    })
  }

  private matchesUnitFilters(
    project: IProject,
    centerIds: number[],
    academicUnitIds: number[],
    unitsById: Map<number, IOrganizationalUnit>
  ): boolean {
    if (!project.executing_unit) {
      return false
    }

    if (academicUnitIds.length) {
      const selectedAcademicUnits = new Set(academicUnitIds)
      const academicUnitId = this.resolveAcademicUnitId(project.executing_unit.id, unitsById)
      return academicUnitId !== null && selectedAcademicUnits.has(academicUnitId)
    }

    const selectedCenters = new Set(centerIds)
    const centerId = this.resolveCenterIdFromUnit(project.executing_unit.id, unitsById)
    return centerId !== null && selectedCenters.has(centerId)
  }

  private getUnitsByIdMap(): Map<number, IOrganizationalUnit> {
    return new Map(this.units.map(unit => [unit.id, unit]))
  }

  private isDescendantOfCenter(
    unitId: number,
    centerIds: Set<number>,
    unitsById: Map<number, IOrganizationalUnit>
  ): boolean {
    const centerId = this.resolveCenterIdFromUnit(unitId, unitsById)
    return centerId !== null && centerIds.has(centerId)
  }

  private resolveAcademicUnitId(
    unitId: number,
    unitsById: Map<number, IOrganizationalUnit>
  ): number | null {
    let currentUnitId: number | undefined = unitId

    while (typeof currentUnitId === 'number') {
      const unit = unitsById.get(currentUnitId)
      if (!unit) {
        return null
      }

      if (unit.type === 'instituto' || unit.type === 'escola') {
        return unit.id
      }

      if (!unit.parent_unit_id || unit.parent_unit_id === unit.id) {
        return null
      }

      currentUnitId = unit.parent_unit_id
    }

    return null
  }

  private resolveCenterIdFromUnit(
    unitId: number,
    unitsById: Map<number, IOrganizationalUnit>
  ): number | null {
    let currentUnitId: number | undefined = unitId

    while (typeof currentUnitId === 'number') {
      const unit = unitsById.get(currentUnitId)
      if (!unit) {
        return null
      }

      if (unit.type === 'centro') {
        return unit.id
      }

      if (!unit.parent_unit_id || unit.parent_unit_id === unit.id) {
        return null
      }

      currentUnitId = unit.parent_unit_id
    }

    return null
  }

  private cloneFilters(filters: IProjectFilters): IProjectFilters {
    return {
      ...filters,
      areaIds: [...filters.areaIds],
      courseIds: [...filters.courseIds],
      centerIds: [...filters.centerIds],
      academicUnitIds: [...filters.academicUnitIds]
    }
  }

  private areFiltersEqual(previous: IProjectFilters, next: IProjectFilters): boolean {
    return (
      previous.search.trim() === next.search.trim() &&
      this.sameArray(previous.areaIds, next.areaIds) &&
      this.sameArray(previous.courseIds, next.courseIds) &&
      this.sameArray(previous.centerIds, next.centerIds) &&
      this.sameArray(previous.academicUnitIds, next.academicUnitIds) &&
      previous.modality === next.modality &&
      previous.deadline === next.deadline &&
      previous.level === next.level &&
      previous.sort === next.sort
    )
  }

  private sameArray(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false
    return a.every((value, index) => value === b[index])
  }
}
