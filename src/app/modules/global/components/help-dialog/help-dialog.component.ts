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
        'Visitantes podem conhecer os projetos publicados. Docentes, técnicos e administradores acessam recursos adicionais após entrar com a conta institucional.'
      ]
    },
    {
      id: 'perfis',
      icon: 'pi-users',
      title: 'Tipos de usuário',
      summary: 'Visitante, docente, técnico e administrador.',
      body: [
        'Visitante: navega pela página inicial e lista de projetos vigentes, sem precisar entrar.',
        'Docente: gerencia seus projetos e atribuições.',
        'Técnico: gerencia seus projetos e atribuições.',
        'Administrador: gerencia usuários, configurações institucionais e dados mestres do sistema.'
      ]
    },
    {
      id: 'editais',
      icon: 'pi-file',
      title: 'Projetos vigentes',
      summary: 'Como navegar, filtrar e entrar em contato.',
      body: [
        'Na tela de projetos você vê cards com título, unidade responsável, áreas de conhecimento e responsável.',
        'Use a busca e os filtros para refinar por curso, unidade, área ou modalidade.',
        'Clique no card ou em "Detalhes" para ver o projeto completo. Quando houver email de contato, use o botão para abrir seu aplicativo de email.'
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
    {
      id: 'contato',
      icon: 'pi-envelope',
      title: 'Email de contato',
      summary: 'Disponível para qualquer visitante quando houver email.',
      body: [
        'Dentro dos detalhes de um projeto, o botão "Abrir email de contato" abre o seu aplicativo de email padrão.',
        'O assunto e o corpo inicial podem vir preenchidos para facilitar o envio.',
        'O envio da mensagem acontece fora do sistema, no seu próprio email.'
      ]
    },
    {
      id: 'conta',
      icon: 'pi-user',
      title: 'Sua conta',
      summary: 'Perfil, preferências e segurança.',
      body: [
        'Clique no seu avatar no canto superior direito para abrir o menu da conta.',
        'Em "Gerenciar sua conta institucional" você ajusta foto, dados pessoais e preferências.',
        'Em "Privacidade e segurança" troca a senha, gerencia sessões e revisa permissões.',
        'O botão da lua/sol no topo alterna entre tema escuro e claro em toda a plataforma.'
      ]
    }
  ]

  toggle(id: string) {
    this.openId = this.openId === id ? null : id
  }

  close() {
    this.visibleChange.emit(false)
  }
}
