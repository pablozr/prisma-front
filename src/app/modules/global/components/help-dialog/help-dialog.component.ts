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
        'O PRISMA reúne, num único espaço, os projetos acadêmicos vigentes oferecidos pela UNIRIO.',
        'Visitantes podem conhecer os projetos publicados. Alunos consultam o catálogo após entrar; docentes, técnicos e administradores acessam recursos adicionais conforme suas permissões.'
      ]
    },
    {
      id: 'perfis',
      icon: 'pi-users',
      title: 'Tipos de usuário',
        summary: 'Visitante, aluno, docente, técnico e administrador.',
      body: [
        'Visitante: navega pela página inicial e lista de projetos vigentes, sem precisar entrar.',
        'Aluno: consulta o catálogo e não edita projetos.',
        'Docente e técnico: acessam Meus projetos quando possuem permissão de edição.',
        'Administrador: acessa a gestão de projetos e as funções administrativas autorizadas.'
      ]
    },
    {
      id: 'editais',
      icon: 'pi-file',
      title: 'Projetos vigentes',
        summary: 'Como navegar e filtrar o catálogo.',
      body: [
        'Na tela de projetos você vê os dados institucionais e o conteúdo de divulgação disponível.',
        'Use a busca e os filtros disponíveis para refinar o catálogo.',
        'Clique no card ou em "Detalhes" para ver o projeto completo.'
      ]
    },
    {
      id: 'prazos',
      icon: 'pi-clock',
      title: 'Status dos prazos',
      summary: 'O que significa cada badge colorido no card.',
      body: [
        'Publicado: projeto visível na listagem pública.',
        'Rascunho: projeto ainda em preparação.',
        'Arquivado: projeto encerrado e sem novas atualizações públicas.',
        'As datas de início e fim indicam o período de vigência quando informadas.'
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
