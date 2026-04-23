import { Component, ElementRef, HostListener, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { Router, RouterLink } from '@angular/router'
import { SidebarComponent } from '../sidebar/sidebar.component'
import { ISigninData } from '../../interfaces/ISignin'
import { UsersService } from '../../services/users/users.service'
import { ThemeService } from '../../services/theme/theme.service'

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, SidebarComponent, RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  private usersService = inject(UsersService)
  private router = inject(Router)
  private host = inject(ElementRef<HTMLElement>)
  private themeService = inject(ThemeService)

  userData: ISigninData | null = null
  menuOpen = false
  isDark = true
  sessionReady = false

  private readonly roleMap: Record<string, string> = {
    admin: 'Administrador',
    student: 'Estudante',
    professor: 'Docente'
  }

  get isAuthenticated(): boolean {
    return !!this.userData?.user
  }

  get initials(): string {
    const name = this.userData?.user?.full_name?.trim() || ''
    if (!name) return 'U'
    const parts = name.split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase()
  }

  get avatarUrl(): string {
    const name = this.userData?.user?.full_name || 'U'
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=004b82&color=FFF&size=160&bold=true`
  }

  get firstName(): string {
    const full = this.userData?.user?.full_name?.trim() || ''
    const first = full.split(/\s+/).filter(Boolean)[0] || ''
    return first
  }

  ngOnInit() {
    this.usersService.user$.subscribe((data) => {
      this.userData = data
    })

    this.usersService.initialized$.subscribe((ready) => {
      this.sessionReady = ready
    })

    this.themeService.themeInformation.subscribe((t) => {
      this.isDark = t === 'dark'
    })
  }

  toggleTheme() {
    this.themeService.toggleDarkMode()
  }

  toggleMenu(event: MouseEvent) {
    event.stopPropagation()
    this.menuOpen = !this.menuOpen
  }

  closeMenu() {
    this.menuOpen = false
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.menuOpen) return
    const target = event.target as Node
    if (!this.host.nativeElement.contains(target)) {
      this.menuOpen = false
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.menuOpen) this.menuOpen = false
  }

  goTo(route: string, queryParams?: Record<string, string>) {
    this.menuOpen = false
    this.router.navigate([route], queryParams ? { queryParams } : undefined)
  }

  async logout() {
    this.menuOpen = false
    await this.usersService.logout()
  }

  roleLabel(role: string | undefined | null): string {
    if (!role) return 'Sem cargo'
    return this.roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1)
  }
}
