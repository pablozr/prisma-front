import { Component, DestroyRef, inject, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
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
  IAdminMetrics,
  IAdminProject,
  IAdminSyncRun,
  IAdminSyncRunFailure,
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
  private destroyRef = inject(DestroyRef)

  userData: ISigninData | null = null
  metricsLoading = false
  usersLoading = false
  projectsLoading = false
  syncRunsLoading = false
  syncRunFailuresLoading = false
  savingUserById: Record<number, boolean> = {}
  savingProjectById: Record<number, boolean> = {}

  metrics: IMetric[] = []
  users: IAdminUser[] = []
  projects: IAdminProject[] = []
  syncRuns: IAdminSyncRun[] = []
  syncRunFailures: IAdminSyncRunFailure[] = []
  selectedSyncRunId: number | null = null
  userDraftById: Record<number, { role: 'admin' | 'professor' | 'tecnico' | 'aluno'; is_active: boolean }> = {}
  projectDraftById: Record<number, { publication_status: 'draft' | 'published' | 'archived'; is_visible: boolean }> = {}

  userSearch = ''
  usersPage = 1
  usersPageSize = 10
  usersPagination: IAdminUsersPagination = { page: 1, page_size: 10, total: 0, total_pages: 0 }

  projectSearch = ''
  projectsPage = 1
  projectsPageSize = 10
  projectsPagination: IAdminUsersPagination = { page: 1, page_size: 10, total: 0, total_pages: 0 }
  syncRunsPage = 1
  syncRunsPageSize = 10
  syncRunsPagination: IAdminUsersPagination = { page: 1, page_size: 10, total: 0, total_pages: 0 }

  readonly roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Docente', value: 'professor' },
    { label: 'Técnico', value: 'tecnico' },
    { label: 'Aluno', value: 'aluno' }
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
    this.usersService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.userData = data
    })

    await this.loadMetrics()
    await this.loadUsers()
    await this.loadProjects()
    await this.loadSyncRuns()
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
      { label: 'Projetos ocultos', value: data.inactive_projects, hint: 'Não visíveis no catálogo' },
      { label: 'Total de usuários', value: data.total_users, hint: 'Docentes, técnicos e admins' },
      { label: 'Usuários ativos', value: data.active_users, hint: 'Com acesso habilitado' }
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

  private normalizeRole(role: string): 'admin' | 'professor' | 'tecnico' | 'aluno' {
    if (role === 'admin' || role === 'tecnico' || role === 'professor' || role === 'aluno') {
      return role
    }
    return 'aluno'
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
        publication_status: this.normalizeProjectStatus(project.publication_status),
        is_visible: project.is_visible
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

  async loadSyncRuns() {
    this.syncRunsLoading = true
    const result = await this.adminService.listSyncRuns(this.syncRunsPage, this.syncRunsPageSize)
    this.syncRunsLoading = false

    if (!result) {
      this.syncRuns = []
      this.syncRunFailures = []
      this.selectedSyncRunId = null
      return
    }

    this.syncRuns = result.sync_runs
    this.syncRunsPagination = result.pagination
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

  async onSyncRunsPageChange(nextPage: number) {
    if (nextPage < 1 || nextPage > this.syncRunsPagination.total_pages || nextPage === this.syncRunsPage) {
      return
    }

    this.syncRunsPage = nextPage
    await this.loadSyncRuns()
  }

  async openSyncRunFailures(syncRunId: number) {
    this.selectedSyncRunId = syncRunId
    this.syncRunFailuresLoading = true
    const result = await this.adminService.listSyncRunFailures(syncRunId)
    this.syncRunFailures = result?.failures ?? []
    this.syncRunFailuresLoading = false
  }

  hasUserChanges(user: IAdminUser): boolean {
    const draft = this.userDraftById[user.id]
    if (!draft) return false

    return draft.role !== this.normalizeRole(user.role) || draft.is_active !== user.is_active
  }

  hasProjectChanges(project: IAdminProject): boolean {
    const draft = this.projectDraftById[project.id]
    if (!draft) return false

    return draft.publication_status !== this.normalizeProjectStatus(project.publication_status) || draft.is_visible !== project.is_visible
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
      publication_status: draft.publication_status,
      is_visible: draft.is_visible
    })
    this.savingProjectById[project.id] = false

    if (!updated) return

    this.projects = this.projects.map((item) => (item.id === project.id ? { ...item, ...updated } : item))
    this.projectDraftById[project.id] = {
      publication_status: this.normalizeProjectStatus(updated.publication_status),
      is_visible: updated.is_visible
    }
  }

  syncRunStatusLabel(status: string): string {
    return ({ running: 'Em andamento', success: 'Concluída', partial: 'Concluída com pendências', failed: 'Falhou' }[status] ?? status)
  }

  syncSourceLabel(source: string): string {
    return ['sie', 'sie_api'].includes(source.toLowerCase()) ? 'SIE' : source
  }

  formatFailureSummary(summary: string | null): string {
    if (!summary) return 'Sem falha registrada.'

    const sanitized = summary
      .replace(/[\u0000-\u001F\u007F]/g, ' ')
      .replace(/\b\d{3}[.\s-]?\d{3}[.\s-]?\d{3}-?\d{2}\b/g, '[CPF removido]')
      .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '[e-mail removido]')
      .replace(/\s+/g, ' ')
      .trim()

    return sanitized ? sanitized.slice(0, 500) : 'Sem falha registrada.'
  }
}
