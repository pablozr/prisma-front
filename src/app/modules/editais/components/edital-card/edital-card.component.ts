import { Component, EventEmitter, Input, Output, inject } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IProject } from '../../interfaces/IProject'
import { UsersService } from '../../../global/services/users/users.service'

type DeadlineState = 'open' | 'closing_soon' | 'closed' | 'upcoming'

@Component({
  selector: 'app-edital-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edital-card.component.html',
  styleUrl: './edital-card.component.scss'
})
export class EditalCardComponent {
  private usersService = inject(UsersService)

  @Input({ required: true }) project!: IProject
  @Output() contact = new EventEmitter<IProject>()
  @Output() details = new EventEmitter<IProject>()

  get canContact(): boolean {
    const role = this.usersService.currentUser?.user?.role
    return role === 'student' || role === 'admin'
  }

  get professorInitials(): string {
    const parts = this.project.owner_professor.full_name.trim().split(/\s+/).filter(Boolean)
    const first = parts[0]?.[0] || ''
    const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
    return (first + last).toUpperCase() || 'P'
  }

  get professorAvatar(): string {
    const name = encodeURIComponent(this.project.owner_professor.full_name)
    return `https://ui-avatars.com/api/?name=${name}&background=004b82&color=FFF&size=96&bold=true`
  }

  get deadlineState(): DeadlineState {
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

    const diffMs = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    if (diffDays <= 7) return 'closing_soon'
    return 'open'
  }

  get deadlineLabel(): string {
    const state = this.deadlineState
    const end = this.project.ends_at ? new Date(this.project.ends_at) : null

    if (state === 'upcoming' && this.project.starts_at) {
      return `Inicia em ${this.formatDate(this.project.starts_at)}`
    }
    if (state === 'closed' && end) {
      return `Encerrado em ${this.formatDate(this.project.ends_at!)}`
    }
    if (state === 'closing_soon' && end) {
      const days = Math.max(
        1,
        Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
      return `Encerra em ${days} ${days === 1 ? 'dia' : 'dias'}`
    }
    if (end) return `Até ${this.formatDate(this.project.ends_at!)}`
    return 'Fluxo contínuo'
  }

  get modalityLabel(): string {
    switch (this.project.modality) {
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
    switch (this.project.modality) {
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

  get coursesShort(): string {
    if (!this.project.courses?.length) return 'Todos os cursos'
    const names = this.project.courses.slice(0, 2).map(c => c.name)
    const extra = this.project.courses.length - 2
    return extra > 0 ? `${names.join(', ')} +${extra}` : names.join(', ')
  }

  get unitShort(): string {
    return this.project.executing_unit?.short_name || this.project.executing_unit?.name || '—'
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short'
    })
  }

  onContact(event: Event) {
    event.stopPropagation()
    this.contact.emit(this.project)
  }

  onDetails() {
    this.details.emit(this.project)
  }
}
