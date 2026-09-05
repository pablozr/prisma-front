import { Component, DestroyRef, inject, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { ISigninData } from '../../interfaces/ISignin'
import { UsersService } from '../../services/users/users.service'
import { HeaderComponent } from '../../components/header/header.component'
import { ProjectsService } from '../../../editais/services/projects/projects.service'
import { IProject } from '../../../editais/interfaces/IProject'

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, RouterLink],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private usersService = inject(UsersService)
  private router = inject(Router)
  private destroyRef = inject(DestroyRef)
  private projectsService = inject(ProjectsService)
  userData: ISigninData | null = null
  search = ''
  projects: IProject[] = []
  loading = true
  loadFailed = false
  total: number | null = null

  ngOnInit() {
    this.usersService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => this.userData = data)
    this.loadProjects()
  }

  get isAuthenticated(): boolean { return !!this.userData?.user }
  get firstName(): string { return this.userData?.user?.full_name?.trim().split(/\s+/)[0] || 'boas-vindas' }
  get canManage(): boolean { return ['professor', 'tecnico', 'admin'].includes(this.userData?.user?.role || '') }
  get isAdmin(): boolean { return this.userData?.user?.role === 'admin' }

  loadProjects() {
    this.loading = true
    this.loadFailed = false
    this.projectsService.listProjects({ search: '', areaIds: [], courseIds: [], centerIds: [], academicUnitIds: [], sort: 'recent' }, 1, 3, false)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(response => {
        this.projects = response.projects
        this.loadFailed = !!response.failed
        this.total = response.failed ? null : response.pagination.total
        this.loading = false
      })
  }

  searchProjects() {
    this.router.navigate(['/catalogo'], { queryParams: this.search.trim() ? { q: this.search.trim() } : {} })
  }

  openProject(project: IProject) {
    this.router.navigate(['/catalogo'], { queryParams: { projeto: project.id } })
  }
}
