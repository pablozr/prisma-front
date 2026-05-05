import { Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { TabsModule } from 'primeng/tabs'
import { ButtonModule } from 'primeng/button'
import { InputTextModule } from 'primeng/inputtext'
import { SelectModule } from 'primeng/select'
import { HeaderComponent } from '../../../global/components/header/header.component'
import { BreadcrumbsComponent, IBreadcrumbItem } from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { ISigninData } from '../../../global/interfaces/ISignin'
import { UsersService } from '../../../global/services/users/users.service'
import { AdminService } from '../../services/admin.service'
import {
  IAdminImportBatch,
  IAdminImportError,
  IAdminMetrics,
  IAdminProject,
  IAdminUser,
  IAdminUsersPagination
} from '../../interfaces/IAdmin'

interface IMetric {
  label: string
  value: number
  hint: string
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TabsModule,
    ButtonModule,
    InputTextModule,
    SelectModule,
    HeaderComponent,
    BreadcrumbsComponent
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private usersService = inject(UsersService)
  private adminService = inject(AdminService)

  userData: ISigninData | null = null
  metricsLoading = false
  usersLoading = false
  projectsLoading = false
  importsLoading = false
  importUploading = false
  importErrorsLoading = false
  savingUserById: Record<number, boolean> = {}
  savingProjectById: Record<number, boolean> = {}

  metrics: IMetric[] = []
  users: IAdminUser[] = []
  projects: IAdminProject[] = []
  importBatches: IAdminImportBatch[] = []
  importErrors: IAdminImportError[] = []
  selectedImportBatchId: number | null = null
  selectedImportFile: File | null = null
  userDraftById: Record<number, { role: 'admin' | 'professor' | 'tecnico'; is_active: boolean }> = {}
  projectDraftById: Record<number, { status: 'draft' | 'published' | 'archived'; is_active: boolean }> = {}

  userSearch = ''
  usersPage = 1
  usersPageSize = 10
  usersPagination: IAdminUsersPagination = { page: 1, page_size: 10, total: 0, total_pages: 0 }

  projectSearch = ''
  projectsPage = 1
  projectsPageSize = 10
  projectsPagination: IAdminUsersPagination = { page: 1, page_size: 10, total: 0, total_pages: 0 }
  importsPage = 1
  importsPageSize = 10
  importsPagination: IAdminUsersPagination = { page: 1, page_size: 10, total: 0, total_pages: 0 }

  readonly roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Docente', value: 'professor' },
    { label: 'Tecnico', value: 'tecnico' }
  ]

  readonly projectStatusOptions = [
    { label: 'Rascunho', value: 'draft' },
    { label: 'Publicado', value: 'published' },
    { label: 'Arquivado', value: 'archived' }
  ]

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', route: '/home', icon: 'pi pi-home' },
    { label: 'Painel administrativo', icon: 'pi pi-shield' }
  ]

  async ngOnInit() {
    this.usersService.user$.subscribe((data) => {
      this.userData = data
    })

    await this.loadMetrics()
    await this.loadUsers()
    await this.loadProjects()
    await this.loadImports()
  }

  get firstName(): string {
    const full = this.userData?.user?.full_name?.trim()
    if (!full) return 'Administrador'
    return full.split(' ')[0]
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR').format(value)
  }

  private buildMetricsCards(data: IAdminMetrics): IMetric[] {
    return [
      { label: 'Total de projetos', value: data.total_projects, hint: 'Todos os status' },
      { label: 'Projetos inativos', value: data.inactive_projects, hint: 'Desativados' },
      { label: 'Total de usuarios', value: data.total_users, hint: 'Docentes, tecnicos e admins' },
      { label: 'Usuarios ativos', value: data.active_users, hint: 'Com acesso habilitado' }
    ]
  }

  private buildUserDraftMap(users: IAdminUser[]) {
    const entries = users.map((user) => [
      user.id,
      {
        role: this.normalizeRole(user.role),
        is_active: user.is_active
      }
    ])

    this.userDraftById = Object.fromEntries(entries)
  }

  private normalizeRole(role: string): 'admin' | 'professor' | 'tecnico' {
    if (role === 'admin' || role === 'tecnico' || role === 'professor') {
      return role
    }
    return 'professor'
  }

  private normalizeProjectStatus(status: string): 'draft' | 'published' | 'archived' {
    if (status === 'draft' || status === 'published' || status === 'archived') {
      return status
    }
    return 'draft'
  }

  private buildProjectDraftMap(projects: IAdminProject[]) {
    const entries = projects.map((project) => [
      project.id,
      {
        status: this.normalizeProjectStatus(project.status),
        is_active: project.is_active
      }
    ])

    this.projectDraftById = Object.fromEntries(entries)
  }

  async loadMetrics() {
    this.metricsLoading = true
    const metrics = await this.adminService.getMetrics()
    this.metrics = metrics ? this.buildMetricsCards(metrics) : []
    this.metricsLoading = false
  }

  async loadUsers() {
    this.usersLoading = true
    const result = await this.adminService.listUsers(this.usersPage, this.usersPageSize, this.userSearch)
    this.usersLoading = false

    if (!result) {
      this.users = []
      return
    }

    this.users = result.users
    this.usersPagination = result.pagination
    this.buildUserDraftMap(result.users)
  }

  async loadProjects() {
    this.projectsLoading = true
    const result = await this.adminService.listProjects(this.projectsPage, this.projectsPageSize, this.projectSearch)
    this.projectsLoading = false

    if (!result) {
      this.projects = []
      return
    }

    this.projects = result.projects
    this.projectsPagination = result.pagination
    this.buildProjectDraftMap(result.projects)
  }

  async loadImports() {
    this.importsLoading = true
    const result = await this.adminService.listImports(this.importsPage, this.importsPageSize)
    this.importsLoading = false

    if (!result) {
      this.importBatches = []
      this.importErrors = []
      this.selectedImportBatchId = null
      return
    }

    this.importBatches = result.batches
    this.importsPagination = result.pagination
  }

  async onSearchUsers() {
    this.usersPage = 1
    await this.loadUsers()
  }

  async onUsersPageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > this.usersPagination.total_pages || nextPage === this.usersPage) {
      return
    }

    this.usersPage = nextPage
    await this.loadUsers()
  }

  async onSearchProjects() {
    this.projectsPage = 1
    await this.loadProjects()
  }

  async onProjectsPageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > this.projectsPagination.total_pages || nextPage === this.projectsPage) {
      return
    }

    this.projectsPage = nextPage
    await this.loadProjects()
  }

  async onImportsPageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > this.importsPagination.total_pages || nextPage === this.importsPage) {
      return
    }

    this.importsPage = nextPage
    await this.loadImports()
  }

  onImportFileSelected(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0] ?? null
    this.selectedImportFile = file
  }

  async submitImport() {
    if (!this.selectedImportFile) return

    this.importUploading = true
    const created = await this.adminService.uploadImport(this.selectedImportFile)
    this.importUploading = false

    if (!created) return

    this.selectedImportFile = null
    await this.loadImports()
  }

  async openImportErrors(batchId: number) {
    this.selectedImportBatchId = batchId
    this.importErrorsLoading = true
    this.importErrors = await this.adminService.listImportErrors(batchId)
    this.importErrorsLoading = false
  }

  hasUserChanges(user: IAdminUser): boolean {
    const draft = this.userDraftById[user.id]
    if (!draft) return false

    return draft.role !== this.normalizeRole(user.role) || draft.is_active !== user.is_active
  }

  hasProjectChanges(project: IAdminProject): boolean {
    const draft = this.projectDraftById[project.id]
    if (!draft) return false

    return draft.status !== this.normalizeProjectStatus(project.status) || draft.is_active !== project.is_active
  }

  async saveUser(user: IAdminUser) {
    const draft = this.userDraftById[user.id]
    if (!draft || !this.hasUserChanges(user)) return

    this.savingUserById[user.id] = true
    const updated = await this.adminService.updateUser(user.id, {
      role: draft.role,
      is_active: draft.is_active
    })
    this.savingUserById[user.id] = false

    if (!updated) return

    this.users = this.users.map((item) => (item.id === user.id ? updated : item))
    this.userDraftById[user.id] = {
      role: this.normalizeRole(updated.role),
      is_active: updated.is_active
    }
  }

  async saveProject(project: IAdminProject) {
    const draft = this.projectDraftById[project.id]
    if (!draft || !this.hasProjectChanges(project)) return

    this.savingProjectById[project.id] = true
    const updated = await this.adminService.updateProject(project.id, {
      status: draft.status,
      is_active: draft.is_active
    })
    this.savingProjectById[project.id] = false

    if (!updated) return

    this.projects = this.projects.map((item) => (item.id === project.id ? { ...item, ...updated } : item))
    this.projectDraftById[project.id] = {
      status: this.normalizeProjectStatus(updated.status),
      is_active: updated.is_active
    }
  }
}
