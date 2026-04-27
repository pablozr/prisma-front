import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect'
import { SelectModule } from 'primeng/select'
import { SelectButtonModule } from 'primeng/selectbutton'
import { ButtonModule } from 'primeng/button'
import {
  ICourse,
  IOrganizationalUnit,
  IProjectArea,
  IProjectFilters
} from '../../interfaces/IProject'

interface IOption<T = string | number> {
  label: string
  value: T
  icon?: string
}

type DeadlineValue = NonNullable<IProjectFilters['deadline']>

@Component({
  selector: 'app-edital-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    MultiSelectModule,
    SelectModule,
    SelectButtonModule,
    ButtonModule
  ],
  templateUrl: './edital-filters.component.html',
  styleUrl: './edital-filters.component.scss'
})
export class EditalFiltersComponent implements OnChanges {
  @Input({ required: true }) filters!: IProjectFilters
  @Input({ required: true }) areas: IProjectArea[] = []
  @Input({ required: true }) courses: ICourse[] = []
  @Input({ required: true }) units: IOrganizationalUnit[] = []
  @Input() resultCount = 0

  @Output() filtersChange = new EventEmitter<IProjectFilters>()
  @Output() reset = new EventEmitter<void>()

  modalityOptions: IOption<string>[] = [
    { label: 'Presencial', value: 'presencial' },
    { label: 'Remoto', value: 'remoto' },
    { label: 'Híbrido', value: 'hibrido' }
  ]

  deadlineOptions: IOption<DeadlineValue>[] = [
    { label: 'Abertos', value: 'open', icon: 'pi pi-clock' },
    { label: 'Encerrando', value: 'closing_soon', icon: 'pi pi-exclamation-triangle' },
    { label: 'Encerrados', value: 'closed', icon: 'pi pi-times-circle' }
  ]

  levelOptions: IOption<string>[] = [
    { label: 'Graduação', value: 'graduacao' },
    { label: 'Pós-graduação', value: 'pos' }
  ]

  sortOptions: IOption<string>[] = [
    { label: 'Mais recentes', value: 'recent' },
    { label: 'Prazo mais próximo', value: 'deadline' },
    { label: 'Ordem alfabética', value: 'alphabetical' }
  ]

  areaOptions: IOption<number>[] = []
  courseOptions: IOption<number>[] = []
  unitOptions: IOption<number>[] = []

  ngOnChanges() {
    this.areaOptions = this.areas.map(a => ({ label: a.name, value: a.id }))
    this.courseOptions = this.courses.map(c => ({
      label: `${c.name} · ${c.level === 'graduacao' ? 'Graduação' : 'Pós'}`,
      value: c.id
    }))
    this.unitOptions = this.units.map(u => ({
      label: u.short_name ? `${u.short_name} — ${u.name}` : u.name,
      value: u.id
    }))
  }

  get activeCount(): number {
    let n = 0
    if (this.filters.search.trim()) n++
    if (this.filters.areaIds.length) n++
    if (this.filters.courseIds.length) n++
    if (this.filters.unitIds.length) n++
    if (this.filters.modality) n++
    if (this.filters.deadline) n++
    if (this.filters.level) n++
    return n
  }

  onChange() {
    this.filtersChange.emit({ ...this.filters })
  }

  onReset() {
    this.reset.emit()
  }
}
