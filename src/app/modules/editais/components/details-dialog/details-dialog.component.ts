import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core'
import { CommonModule } from '@angular/common'
import { DialogModule } from 'primeng/dialog'
import { IProject } from '../../interfaces/IProject'
import { parseProjectDate } from '../../utils/project-date.utils'

@Component({
  selector: 'app-details-dialog', standalone: true, imports: [CommonModule, DialogModule],
  templateUrl: './details-dialog.component.html', styleUrl: './details-dialog.component.scss', encapsulation: ViewEncapsulation.None
})
export class DetailsDialogComponent {
  @Input() visible = false
  @Input() project: IProject | null = null
  @Output() visibleChange = new EventEmitter<boolean>()

  formatDate(iso: string): string { return parseProjectDate(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) }
  get organizationLabel(): string {
    if (!this.project) return 'Unidade não informada'
    const names = [this.project.institutional.executing_unit?.name, this.project.institutional.center?.name]
      .filter((name): name is string => Boolean(name))
    return [...new Set(names)].join(' · ') || 'Unidade não informada'
  }
  get periodLabel(): string {
    if (!this.project) return 'Período não informado'
    const { starts_at, ends_at } = this.project.institutional
    if (starts_at && ends_at) return `${this.formatDate(starts_at)} a ${this.formatDate(ends_at)}`
    if (starts_at) return `A partir de ${this.formatDate(starts_at)}`
    if (ends_at) return `Até ${this.formatDate(ends_at)}`
    return 'Período não informado'
  }
  close() { this.visible = false; this.visibleChange.emit(false) }
}
