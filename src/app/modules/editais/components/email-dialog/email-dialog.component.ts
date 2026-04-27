import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation,
  inject
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { DialogModule } from 'primeng/dialog'
import { InputTextModule } from 'primeng/inputtext'
import { TextareaModule } from 'primeng/textarea'
import { ButtonModule } from 'primeng/button'
import { MessageService } from 'primeng/api'
import { IEmailDispatch, IProject } from '../../interfaces/IProject'
import { ProjectsService } from '../../services/projects/projects.service'
import { UsersService } from '../../../global/services/users/users.service'

@Component({
  selector: 'app-email-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ButtonModule
  ],
  templateUrl: './email-dialog.component.html',
  styleUrl: './email-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class EmailDialogComponent implements OnChanges {
  @Input() visible = false
  @Input() project: IProject | null = null

  @Output() visibleChange = new EventEmitter<boolean>()
  @Output() sent = new EventEmitter<IEmailDispatch>()

  private projectsService = inject(ProjectsService)
  private usersService = inject(UsersService)
  private messageService = inject(MessageService)

  subject = ''
  body = ''
  sending = false

  get professorInitials(): string {
    const fullName = this.project?.owner_professor.full_name.trim()
    if (!fullName) {
      return 'PR'
    }

    const parts = fullName.split(/\s+/).filter(Boolean)
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  get contactDestination(): string {
    if (!this.project) {
      return 'Nao informado'
    }

    return (
      this.project.contact_email ||
      this.project.owner_professor.institutional_email ||
      'Nao informado'
    )
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['project'] && this.project) {
      this.resetForm()
    }
  }

  private resetForm() {
    if (!this.project) return
    this.subject = `[SIEPA] Interesse no edital ${this.project.process_code || ''}`.trim()
    const userName = this.usersService.currentUser?.user?.full_name || 'aluno interessado'
    this.body =
      `Olá, Prof(a). ${this.project.owner_professor.full_name},\n\n` +
      `Meu nome é ${userName} e tenho interesse no edital "${this.project.title}".\n\n` +
      `Gostaria de saber mais sobre o processo seletivo, requisitos e próximos passos.\n\n` +
      `Atenciosamente.`
  }

  close() {
    if (this.sending) return
    this.visible = false
    this.visibleChange.emit(false)
  }

  send() {
    if (!this.project || !this.subject.trim() || !this.body.trim()) return

    const destination =
      this.project.contact_email?.trim() ||
      this.project.owner_professor.institutional_email?.trim()

    if (!destination) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Contato indisponivel',
        detail: 'Este edital ainda nao possui um email de contato configurado.',
        life: 4000
      })
      return
    }

    const dispatch: IEmailDispatch = {
      project_id: this.project.id,
      to_email: destination,
      subject: this.subject.trim(),
      body: this.body.trim()
    }

    this.sending = true
    this.projectsService.sendEmail(dispatch).subscribe({
      next: () => {
        this.sending = false
        this.messageService.add({
          severity: 'success',
          summary: 'Email enviado',
          detail: `Sua mensagem foi encaminhada para ${this.project?.owner_professor.full_name}.`,
          life: 4000
        })
        this.sent.emit(dispatch)
        this.close()
      },
      error: () => {
        this.sending = false
        this.messageService.add({
          severity: 'error',
          summary: 'Falha ao enviar',
          detail: 'Não foi possível enviar sua mensagem agora. Tente novamente.',
          life: 5000
        })
      }
    })
  }
}
