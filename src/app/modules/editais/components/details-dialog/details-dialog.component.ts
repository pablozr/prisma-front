import { Component, EventEmitter, Input, Output, ViewEncapsulation, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DialogModule } from 'primeng/dialog'
import { IProject } from '../../interfaces/IProject'
import { UsersService } from '../../../global/services/users/users.service'

type DeadlineState = 'open' | 'closing_soon' | 'closed' | 'upcoming'

@Component({
  selector: 'app-details-dialog',
  standalone: true,
  imports: [CommonModule, DialogModule],
  templateUrl: './details-dialog.component.html',
  styleUrl: './details-dialog.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class DetailsDialogComponent {
  private usersService = inject(UsersService)

  @Input() visible = false
  @Input() project: IProject | null = null

  @Output() visibleChange = new EventEmitter<boolean>()
  @Output() contact = new EventEmitter<IProject>()

  private get hasContactEmail(): boolean {
    return !!this.project?.contact_email?.trim()
  }

  get canContact(): boolean {
    const role = this.usersService.currentUser?.user?.role
    return this.hasContactEmail && (role === 'student' || role === 'admin')
  }

  get contactHint(): string {
    if (!this.hasContactEmail) {
      return 'Este edital ainda nao possui email de contato cadastrado.'
    }

    return 'Entre com sua conta de aluno ou administrador para contatar o professor.'
  }

  get professorAvatar(): string {
    if (!this.project) return ''
    const name = encodeURIComponent(this.project.owner_professor.full_name)
    return `https://ui-avatars.com/api/?name=${name}&background=004b82&color=FFF&size=128&bold=true`
  }

  get deadlineState(): DeadlineState {
    if (!this.project) return 'open'
    const { starts_at, ends_at } = this.project
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (starts_at) {
      const start = new Date(starts_at)
      if (start > today) return 'upcoming'
    }
    if (!ends_at) return 'open'

    const end = new Date(ends_at)
    if (end < today) return 'closed'

    const diffDays = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) return 'closing_soon'
    return 'open'
  }

  get deadlineLabel(): string {
    if (!this.project) return ''
    const state = this.deadlineState
    const { starts_at, ends_at } = this.project

    if (state === 'upcoming' && starts_at) {
      return `Inicia em ${this.formatDate(starts_at)}`
    }
    if (state === 'closed' && ends_at) {
      return `Encerrado em ${this.formatDate(ends_at)}`
    }
    if (state === 'closing_soon' && ends_at) {
      const end = new Date(ends_at)
      const days = Math.max(
        1,
        Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
      return `Encerra em ${days} ${days === 1 ? 'dia' : 'dias'}`
    }
    if (ends_at) return `Até ${this.formatDate(ends_at)}`
    return 'Fluxo contínuo'
  }

  get deadlineIcon(): string {
    const state = this.deadlineState
    if (state === 'closing_soon') return 'pi pi-exclamation-triangle'
    if (state === 'closed') return 'pi pi-times-circle'
    return 'pi pi-clock'
  }

  get modalityLabel(): string {
    switch (this.project?.modality) {
      case 'presencial':
        return 'Presencial'
      case 'remoto':
        return 'Remoto'
      case 'hibrido':
        return 'Híbrido'
      default:
        return 'A definir'
    }
  }

  get modalityIcon(): string {
    switch (this.project?.modality) {
      case 'presencial':
        return 'pi pi-building'
      case 'remoto':
        return 'pi pi-globe'
      case 'hibrido':
        return 'pi pi-sync'
      default:
        return 'pi pi-map-marker'
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  close() {
    this.visible = false
    this.visibleChange.emit(false)
  }

  onContact() {
    if (!this.project || !this.canContact) return
    this.contact.emit(this.project)
    this.close()
  }
}
