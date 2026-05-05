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
import { IAdminMetrics, IAdminUser, IAdminUsersPagination } from '../../interfaces/IAdmin'

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
  savingUserById: Record<number, boolean> = {}

  metrics: IMetric[] = []
  users: IAdminUser[] = []
  userDraftById: Record<number, { role: 'admin' | 'professor' | 'tecnico'; is_active: boolean }> = {}

  userSearch = ''
  usersPage = 1
  usersPageSize = 10
  usersPagination: IAdminUsersPagination = { page: 1, page_size: 10, total: 0, total_pages: 0 }

  readonly roleOptions = [
    { label: 'Admin', value: 'admin' },
    { label: 'Docente', value: 'professor' },
    { label: 'Tecnico', value: 'tecnico' }
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

  hasUserChanges(user: IAdminUser): boolean {
    const draft = this.userDraftById[user.id]
    if (!draft) return false

    return draft.role !== this.normalizeRole(user.role) || draft.is_active !== user.is_active
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
}
