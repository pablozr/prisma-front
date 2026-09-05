import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { ActivatedRoute } from '@angular/router'
import { Subject, Subscription, debounceTime, forkJoin, switchMap } from 'rxjs'
import { DataViewModule } from 'primeng/dataview'
import { DataViewPageEvent } from 'primeng/dataview'
import { HeaderComponent } from '../../../global/components/header/header.component'
import { BreadcrumbsComponent, IBreadcrumbItem } from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { EditalCardComponent } from '../../components/edital-card/edital-card.component'
import { EditalFiltersComponent } from '../../components/edital-filters/edital-filters.component'
import { DetailsDialogComponent } from '../../components/details-dialog/details-dialog.component'
import { IProjectsListResponse, ProjectsService } from '../../services/projects/projects.service'
import { ICourse, IOrganizationalUnit, IProject, IProjectArea, IProjectFilters } from '../../interfaces/IProject'

interface IProjectsQueryState {
  filters: IProjectFilters
  page: number
}

@Component({
  selector: 'app-editais',
  standalone: true,
  imports: [CommonModule, DataViewModule, HeaderComponent, BreadcrumbsComponent, EditalCardComponent, EditalFiltersComponent, DetailsDialogComponent],
  templateUrl: './editais.component.html',
  styleUrl: './editais.component.scss'
})
export class EditaisComponent implements OnInit, OnDestroy {
  private projectsService = inject(ProjectsService)
  private route = inject(ActivatedRoute)
  private readonly filtersUpdates$ = new Subject<IProjectsQueryState>()
  private filtersSubscription?: Subscription
  private catalogueSubscription?: Subscription
  private detailsLoadSubscription?: Subscription

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', route: '/home', icon: 'pi pi-home' },
    { label: 'Catálogo de projetos', icon: 'pi pi-file' }
  ]
  filteredProjects: IProject[] = []
  areas: IProjectArea[] = []
  courses: ICourse[] = []
  units: IOrganizationalUnit[] = []
  loading = true
  loadFailed = false
  readonly rowsPerPageOptions = [3, 6, 9, 21]
  pageSize = 9
  currentPage = 1
  first = 0
  totalProjects = 0
  filters: IProjectFilters = this.defaultFilters()
  detailsDialogVisible = false
  detailsProject: IProject | null = null

  ngOnInit() {
    this.filters.search = this.route.snapshot.queryParamMap.get('q') || ''
    const projectId = Number(this.route.snapshot.queryParamMap.get('projeto'))
    if (Number.isInteger(projectId) && projectId > 0) {
      this.detailsLoadSubscription = this.projectsService.getProjectDetails(projectId).subscribe({
        next: project => { this.detailsProject = project; this.detailsDialogVisible = true },
        error: () => undefined
      })
    }
    this.startFiltersSync()
    this.refreshProjects()
    this.catalogueSubscription = forkJoin({
      areas: this.projectsService.listAreas(),
      centers: this.projectsService.listCenters(),
      units: this.projectsService.listUnits(),
      courses: this.projectsService.listCourses()
    }).subscribe(({ areas, centers, units, courses }) => {
      this.areas = areas
      this.units = [...centers, ...units]
      this.courses = courses
    })
  }

  ngOnDestroy() {
    this.filtersSubscription?.unsubscribe()
    this.catalogueSubscription?.unsubscribe()
    this.detailsLoadSubscription?.unsubscribe()
    this.filtersUpdates$.complete()
  }

  onFiltersChange(filters: IProjectFilters) {
    this.filters = this.cloneFilters(filters)
    this.currentPage = 1
    this.first = 0
    this.refreshProjects()
  }

  onReset() {
    this.filters = this.defaultFilters()
    this.currentPage = 1
    this.first = 0
    this.refreshProjects()
  }

  onPageChange(event: DataViewPageEvent) {
    this.pageSize = event.rows
    this.first = event.first
    this.currentPage = Math.floor(event.first / event.rows) + 1
    this.refreshProjects()
  }

  onDetails(project: IProject) {
    this.detailsProject = project
    this.detailsDialogVisible = true
    this.detailsLoadSubscription?.unsubscribe()
    this.detailsLoadSubscription = this.projectsService.getProjectDetails(project.id).subscribe({
      next: detailedProject => {
        if (this.detailsProject?.id !== project.id) return
        this.detailsProject = detailedProject
        this.filteredProjects = this.filteredProjects.map(item => item.id === project.id ? detailedProject : item)
      },
      error: () => undefined
    })
  }

  onDetailsDialogVisibleChange(visible: boolean) {
    this.detailsDialogVisible = visible
    if (!visible) this.detailsProject = null
  }

  private defaultFilters(): IProjectFilters {
    return { search: '', areaIds: [], courseIds: [], centerIds: [], academicUnitIds: [], sort: 'recent' }
  }

  refreshProjects() {
    this.filtersUpdates$.next({ filters: this.cloneFilters(this.filters), page: this.currentPage })
  }

  private startFiltersSync() {
    this.filtersSubscription = this.filtersUpdates$.pipe(
      debounceTime(350),
      switchMap(query => {
        this.loading = true
        return this.projectsService.listProjects(query.filters, query.page, this.pageSize, false)
      })
    ).subscribe(response => this.applyProjectsPage(response))
  }

  private applyProjectsPage(response: IProjectsListResponse) {
    this.loadFailed = !!response.failed
    this.filteredProjects = response.projects
    this.currentPage = response.pagination.page
    this.totalProjects = response.pagination.total
    this.loading = false
  }

  private cloneFilters(filters: IProjectFilters): IProjectFilters {
    return { ...filters, areaIds: [...filters.areaIds], courseIds: [...filters.courseIds], centerIds: [...filters.centerIds], academicUnitIds: [...filters.academicUnitIds] }
  }
}
