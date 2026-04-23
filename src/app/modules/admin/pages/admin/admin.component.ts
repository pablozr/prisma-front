import { Component, inject, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HeaderComponent } from '../../../global/components/header/header.component'
import { BreadcrumbsComponent, IBreadcrumbItem } from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { ISigninData } from '../../../global/interfaces/ISignin'
import { UsersService } from '../../../global/services/users/users.service'

interface IMetric {
  label: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'flat'
  hint: string
}

interface IActivity {
  when: string
  actor: string
  action: string
  target: string
}

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, HeaderComponent, BreadcrumbsComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private usersService = inject(UsersService)

  userData: ISigninData | null = null

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', route: '/home', icon: 'pi pi-home' },
    { label: 'Painel administrativo', icon: 'pi pi-shield' }
  ]

  readonly metrics: IMetric[] = [
    { label: 'Utilizadores ativos', value: '1.284', delta: '+3,2%', trend: 'up', hint: 'últimos 30 dias' },
    { label: 'Projetos em curso', value: '176', delta: '+12', trend: 'up', hint: 'este semestre' },
    { label: 'Submissões pendentes', value: '24', delta: '−4', trend: 'down', hint: 'a aguardar parecer' },
    { label: 'Editais abertos', value: '6', delta: '0', trend: 'flat', hint: 'sem alteração' }
  ]

  readonly activities: IActivity[] = [
    { when: 'Há 5 min', actor: 'Ana P. Costa', action: 'aprovou submissão de', target: 'Projeto #2041' },
    { when: 'Há 22 min', actor: 'Rui M. Santos', action: 'criou novo edital', target: 'PIBIC 2026.1' },
    { when: 'Há 1 h', actor: 'Marta L. Dias', action: 'alterou permissões de', target: 'marta.dias@unirio.br' },
    { when: 'Há 3 h', actor: 'Sistema', action: 'concluiu importação de', target: 'planilha docentes.xlsx' },
    { when: 'Ontem', actor: 'Pedro B. Farias', action: 'rejeitou submissão de', target: 'Projeto #1987' }
  ]

  ngOnInit() {
    this.usersService.user$.subscribe((data) => {
      this.userData = data
    })
  }

  get firstName(): string {
    const full = this.userData?.user?.full_name?.trim()
    if (!full) return 'Administrador'
    return full.split(' ')[0]
  }

  trendIcon(trend: IMetric['trend']): string {
    if (trend === 'up') return 'pi pi-arrow-up-right'
    if (trend === 'down') return 'pi pi-arrow-down-right'
    return 'pi pi-minus'
  }
}
