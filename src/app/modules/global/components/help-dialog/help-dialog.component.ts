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
      title: 'O que é o SIEPA?',
      summary: 'Sistema de Iniciação, Extensão e Projetos Acadêmicos da UNIRIO.',
      body: [
        'O SIEPA reúne, num único espaço, as oportunidades acadêmicas oferecidas pela UNIRIO: projetos de iniciação científica (PIBIC), extensão (PIBEX) e demais atividades vinculadas a docentes.',
        'Visitantes podem conhecer os editais publicados. Alunos e docentes acessam recursos adicionais após entrar com a conta institucional.'
      ]
    },
    {
      id: 'perfis',
      icon: 'pi-users',
      title: 'Tipos de usuário',
      summary: 'Visitante, aluno, docente e administrador.',
      body: [
        'Visitante: navega pela página inicial e lista de editais abertos, sem precisar entrar.',
        'Aluno: além da navegação pública, pode contatar o professor responsável por um edital e gerenciar sua conta.',
        'Docente: publica e acompanha seus editais, recebe mensagens de estudantes interessados.',
        'Administrador: gerencia usuários, configurações institucionais e dados mestres do sistema.'
      ]
    },
    {
      id: 'editais',
      icon: 'pi-file',
      title: 'Editais abertos',
      summary: 'Como navegar, filtrar e se candidatar.',
      body: [
        'Na tela Editais você vê cards com título, unidade responsável, áreas de conhecimento, vagas, carga semanal e professor(a) responsável.',
        'Use a busca e os filtros para refinar por curso, unidade, área ou modalidade.',
        'Clique no card ou em "Detalhes" para ver o edital completo. Alunos logados podem contatar o docente diretamente pelo botão "Contatar".'
      ]
    },
    {
      id: 'prazos',
      icon: 'pi-clock',
      title: 'Status dos prazos',
      summary: 'O que significa cada badge colorido no card.',
      body: [
        'Aberto (verde): inscrições em andamento dentro do prazo normal.',
        'Encerra em breve (amarelo/laranja): faltam poucos dias para o encerramento — candidatura urgente.',
        'Em breve (azul): edital publicado, mas as inscrições começarão em data futura.',
        'Encerrado (cinza): o prazo de inscrição já foi concluído e o edital não aceita mais candidatos.'
      ]
    },
    {
      id: 'contato',
      icon: 'pi-envelope',
      title: 'Contatar um docente',
      summary: 'Disponível para alunos e administradores logados.',
      body: [
        'Dentro dos detalhes de um edital, o botão "Contatar professor(a)" abre um formulário pré-preenchido com seus dados.',
        'Você escreve o assunto e a mensagem; o envio é registrado no sistema e o docente recebe a notificação por e-mail institucional.',
        'Se você está como visitante ou docente, o botão não aparece — faça login como aluno ou administrador para habilitá-lo.'
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
