import { Component, DestroyRef, inject, OnInit } from '@angular/core'
import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { CommonModule } from '@angular/common'
import { Router, RouterLink } from '@angular/router'
import { ISigninData } from '../../interfaces/ISignin'
import { UsersService } from '../../services/users/users.service'
import { HeaderComponent } from '../../components/header/header.component'
import { BreadcrumbsComponent, IBreadcrumbItem } from '../../components/breadcrumbs/breadcrumbs.component'

interface IQuickAccessCard {
  label: string
  description: string
  icon: string
  route: string
  roles?: string[]
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HeaderComponent, RouterLink, BreadcrumbsComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
  private usersService = inject(UsersService)
  private router = inject(Router)
  private destroyRef = inject(DestroyRef)

  userData: ISigninData | null = null

  readonly quickAccess: IQuickAccessCard[] = [
    {
      label: 'Meus projetos',
      description: 'Gerencie o conteúdo local dos projetos em que você tem permissão.',
      icon: 'pi pi-book',
      route: '/my-projects',
      roles: ['professor', 'tecnico', 'admin']
    },
    {
      label: 'Catálogo de projetos',
      description: 'Consulte projetos acadêmicos publicados pela UNIRIO.',
      icon: 'pi pi-file',
      route: '/catalogo'
    }
  ]

  ngOnInit() {
    this.usersService.user$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.userData = data
    })
  }

  get isAuthenticated(): boolean {
    return !!this.userData?.user
  }

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', icon: 'pi pi-home' }
  ]

  get firstName(): string {
    const full = this.userData?.user?.full_name?.trim()
    if (!full) return 'bem-vindo(a)'
    return full.split(' ')[0]
  }

  get greeting(): string {
    const h = new Date().getHours()
    if (h < 12) return 'Bom dia'
    if (h < 19) return 'Boa tarde'
    return 'Boa noite'
  }

  canAccess(card: IQuickAccessCard): boolean {
    if (!card.roles) return true
    const role = this.userData?.user?.role
    return !!role && card.roles.includes(role)
  }

  navigateTo(route: string) {
    this.router.navigate([route])
  }
}
