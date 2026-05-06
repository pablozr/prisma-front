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
  requiresAuth?: boolean
}

interface IAnnouncement {
  tag: string
  title: string
  body: string
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
      description: 'Acompanhe projetos em andamento, relatórios e prazos.',
      icon: 'pi pi-book',
      route: '/page1',
      requiresAuth: true
    },
    {
      label: 'Editais abertos',
      description: 'Veja editais de iniciação científica e extensão disponíveis.',
      icon: 'pi pi-file',
      route: '/editais'
    },
    {
      label: 'Calendário acadêmico',
      description: 'Datas importantes, submissões e eventos da universidade.',
      icon: 'pi pi-calendar',
      route: '/home'
    },
    {
      label: 'Central de ajuda',
      description: 'Tire dúvidas e consulte tutoriais da plataforma.',
      icon: 'pi pi-question-circle',
      route: '/home'
    }
  ]

  readonly announcements: IAnnouncement[] = [
    {
      tag: 'Aviso',
      title: 'Submissões PIBIC 2026.1 até 30/04',
      body: 'O formulário de submissão está disponível no módulo Editais.'
    },
    {
      tag: 'Manutenção',
      title: 'Janela programada no sábado, 26/04',
      body: 'O sistema ficará indisponível entre 02h e 05h para atualizações.'
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

  navigateTo(route: string, requiresAuth?: boolean) {
    if (requiresAuth && !this.isAuthenticated) {
      this.router.navigate(['/signin'])
      return
    }
    this.router.navigate([route])
  }
}
