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

type IFilterChipType =
  | 'search'
  | 'area'
  | 'center'
  | 'academicUnit'
  | 'course'
  | 'modality'
  | 'deadline'
  | 'level'

interface IActiveFilterChip {
  key: string
  label: string
  type: IFilterChipType
  value?: number | string
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
  centerOptions: IOption<number>[] = []
  academicUnitOptions: IOption<number>[] = []

  ngOnChanges() {
    const unitsById = new Map(this.units.map(unit => [unit.id, unit]))

    this.areaOptions = this.areas.map(a => ({ label: a.name, value: a.id }))
    this.courseOptions = this.courses.map(c => ({
      label: `${c.name} · ${c.level === 'graduacao' ? 'Graduação' : 'Pós'}`,
      value: c.id
    }))

    this.centerOptions = this.units
      .filter(unit => unit.type === 'centro')
      .map(unit => this.toUnitOption(unit))

    const selectedCenterIds = new Set(this.filters.centerIds)
    const academicUnits = this.units.filter(unit => this.isAcademicUnit(unit.type))

    const visibleAcademicUnits = selectedCenterIds.size
      ? academicUnits.filter(
          unit =>
            typeof unit.parent_unit_id === 'number' && selectedCenterIds.has(unit.parent_unit_id)
        )
      : academicUnits

    this.academicUnitOptions = visibleAcademicUnits.map(unit => {
      const option = this.toUnitOption(unit)
      if (!unit.parent_unit_id) {
        return option
      }

      const center = unitsById.get(unit.parent_unit_id)
      if (!center) {
        return option
      }

      const centerLabel = center.short_name || center.name
      return {
        ...option,
        label: `${option.label} · ${centerLabel}`
      }
    })
  }

  get coursePlaceholder(): string {
    if (this.filters.academicUnitIds.length) {
      return 'Cursos da unidade selecionada'
    }

    if (this.filters.centerIds.length) {
      return 'Cursos do centro selecionado'
    }

    return 'Todos os cursos'
  }

  get activeCount(): number {
    let n = 0
    if (this.filters.search.trim()) n++
    if (this.filters.areaIds.length) n++
    if (this.filters.courseIds.length) n++
    if (this.filters.centerIds.length) n++
    if (this.filters.academicUnitIds.length) n++
    if (this.filters.modality) n++
    if (this.filters.deadline) n++
    if (this.filters.level) n++
    return n
  }

  get activeFilters(): IActiveFilterChip[] {
    const chips: IActiveFilterChip[] = []
    const search = this.filters.search.trim()

    if (search) {
      chips.push({
        key: 'search',
        label: `Busca: ${search}`,
        type: 'search'
      })
    }

    this.addArrayFilterChips(chips, 'area', 'Área', this.filters.areaIds, this.areaOptions)
    this.addArrayFilterChips(chips, 'center', 'Centro', this.filters.centerIds, this.centerOptions)
    this.addArrayFilterChips(
      chips,
      'academicUnit',
      'Unidade',
      this.filters.academicUnitIds,
      this.academicUnitOptions
    )
    this.addArrayFilterChips(chips, 'course', 'Curso', this.filters.courseIds, this.courseOptions)

    if (this.filters.modality) {
      chips.push({
        key: `modality-${this.filters.modality}`,
        label: `Modalidade: ${this.resolveOptionLabel(this.modalityOptions, this.filters.modality)}`,
        type: 'modality'
      })
    }

    if (this.filters.deadline) {
      chips.push({
        key: `deadline-${this.filters.deadline}`,
        label: `Prazo: ${this.resolveOptionLabel(this.deadlineOptions, this.filters.deadline)}`,
        type: 'deadline'
      })
    }

    if (this.filters.level) {
      chips.push({
        key: `level-${this.filters.level}`,
        label: `Nível: ${this.resolveOptionLabel(this.levelOptions, this.filters.level)}`,
        type: 'level'
      })
    }

    return chips
  }

  private isAcademicUnit(type: IOrganizationalUnit['type']): boolean {
    return type === 'instituto' || type === 'escola'
  }

  private toUnitOption(unit: IOrganizationalUnit): IOption<number> {
    return {
      label: unit.short_name ? `${unit.short_name} — ${unit.name}` : unit.name,
      value: unit.id
    }
  }

  onChange() {
    this.filtersChange.emit({ ...this.filters })
  }

  removeFilter(chip: IActiveFilterChip) {
    const value = Number(chip.value)

    switch (chip.type) {
      case 'search':
        this.filters.search = ''
        break
      case 'area':
        this.filters.areaIds = this.filters.areaIds.filter(id => id !== value)
        break
      case 'center':
        this.filters.centerIds = this.filters.centerIds.filter(id => id !== value)
        break
      case 'academicUnit':
        this.filters.academicUnitIds = this.filters.academicUnitIds.filter(id => id !== value)
        break
      case 'course':
        this.filters.courseIds = this.filters.courseIds.filter(id => id !== value)
        break
      case 'modality':
        this.filters.modality = null
        break
      case 'deadline':
        this.filters.deadline = null
        break
      case 'level':
        this.filters.level = null
        break
      default:
        return
    }

    this.onChange()
  }

  onReset() {
    this.reset.emit()
  }

  private addArrayFilterChips(
    chips: IActiveFilterChip[],
    type: Extract<IFilterChipType, 'area' | 'center' | 'academicUnit' | 'course'>,
    prefix: string,
    selectedValues: number[],
    options: IOption<number>[]
  ) {
    for (const value of selectedValues) {
      chips.push({
        key: `${type}-${value}`,
        label: `${prefix}: ${this.resolveOptionLabel(options, value)}`,
        type,
        value
      })
    }
  }

  private resolveOptionLabel<T extends string | number>(options: IOption<T>[], value: T): string {
    const option = options.find(item => item.value === value)
    if (option?.label) {
      return option.label
    }

    return String(value)
  }
}
