import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { IProject } from '../../interfaces/IProject'
import { parseProjectDate } from '../../utils/project-date.utils'

@Component({
  selector: 'app-edital-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './edital-card.component.html',
  styleUrl: './edital-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditalCardComponent {
  @Input({ required: true }) project!: IProject
  @Input() prioritizeCover = false
  @Output() details = new EventEmitter<IProject>()

  get organizationLabel(): string {
    const names = [
      this.project.institutional.executing_unit?.name,
      this.project.institutional.center?.name
    ].filter((name): name is string => Boolean(name))

    return [...new Set(names)].join(' · ') || 'Unidade não informada'
  }

  get periodLabel(): string {
    const { starts_at, ends_at } = this.project.institutional
    if (starts_at && ends_at) return `${this.formatDate(starts_at)} a ${this.formatDate(ends_at)}`
    if (starts_at) return `A partir de ${this.formatDate(starts_at)}`
    if (ends_at) return `Até ${this.formatDate(ends_at)}`
    return 'Não informado'
  }

  onDetails() { this.details.emit(this.project) }

  private formatDate(iso: string): string {
    return parseProjectDate(iso).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }
}
