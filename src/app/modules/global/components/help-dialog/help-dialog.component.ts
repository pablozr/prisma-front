import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DialogModule } from 'primeng/dialog'

interface IHelpItem {
  id: string
  icon: string
  title: string
  summary: string
  body: string[]
}

@Component({
  selector: 'app-help-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './help-dialog.component.html',
  styleUrl: './help-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class HelpDialogComponent {
  @Input() visible = false
  @Output() visibleChange = new EventEmitter<boolean>()

  openId: string | null = 'sobre'

  items: IHelpItem[] = [
    {
      id: 'sobre',
      icon: 'pi-info-circle',
      title: 'O que é o PRISMA?',
      summary: 'Plataforma de Referência e Integração de Saberes e Mediação Acadêmica da UNIRIO.',
      body: [
        'O PRISMA reúne, num único espaço, os projetos acadêmicos publicados pela UNIRIO.',
        'Visitantes podem conhecer os projetos publicados. Alunos também consultam o catálogo sem precisar entrar; docentes, técnicos e administradores acessam recursos adicionais conforme suas permissões.'
      ]
    },
    {
      id: 'perfis',
      icon: 'pi-users',
      title: 'Tipos de usuário',
        summary: 'Visitante, aluno, docente, técnico e administrador.',
      body: [
        'Visitante: navega pela página inicial e lista de projetos publicados, sem precisar entrar.',
        'Aluno: consulta o catálogo e não edita projetos.',
        'Docente e técnico: acessam Meus projetos quando possuem permissão de edição.',
        'Administrador: acessa a gestão de projetos e as funções administrativas autorizadas.'
      ]
    },
    {
      id: 'editais',
      icon: 'pi-file',
      title: 'Catálogo de projetos',
        summary: 'Como navegar e filtrar o catálogo.',
      body: [
        'Na tela de projetos você vê os dados institucionais e o conteúdo de divulgação disponível.',
        'Use a busca e os filtros disponíveis para refinar o catálogo.',
        'Clique em "Ver projeto" para ver o projeto completo.'
      ]
    },
    {
      id: 'prazos',
      icon: 'pi-clock',
      title: 'Período e oportunidades',
      summary: 'Como interpretar as informações do projeto.',
      body: [
        'O tipo do projeto é informado pela universidade.',
        'O período mostra as datas de início e fim, quando disponíveis.',
        'Oportunidades aparecem apenas quando cadastradas pelos responsáveis.',
        'Consulte o contato publicado para esclarecer condições de participação.'
      ]
    },
  ]

  toggle(id: string) {
    this.openId = this.openId === id ? null : id
  }

  close() {
    this.visibleChange.emit(false)
  }
}
