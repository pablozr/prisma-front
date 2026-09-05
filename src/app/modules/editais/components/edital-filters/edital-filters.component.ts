import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { MultiSelectModule } from 'primeng/multiselect'
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

interface IActiveFilterChip {
  key: string
  label: string
  type: IFilterChipType
  value?: number | string
}

@Component({
  selector: 'app-edital-filters',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    InputTextModule,
    MultiSelectModule
  ],
  templateUrl: './edital-filters.component.html',
  styleUrl: './edital-filters.component.scss'
})
export class EditalFiltersComponent implements OnChanges {
  @Input({ required: true }) filters!: IProjectFilters
  @Input({ required: true }) areas: IProjectArea[] = []
  @Input({ required: true }) courses: ICourse[] = []
  @Input({ required: true }) units: IOrganizationalUnit[] = []
  @Input() resultCount: number | null = 0

  @Output() filtersChange = new EventEmitter<IProjectFilters>()
  @Output() reset = new EventEmitter<void>()

  showMoreFilters = false

  areaOptions: IOption<number>[] = []
  courseOptions: IOption<number>[] = []
  centerOptions: IOption<number>[] = []
  academicUnitOptions: IOption<number>[] = []

  ngOnChanges() {
    this.areaOptions = this.areas.map(a => ({ label: a.name, value: a.id }))
    this.courseOptions = this.courses.map(c => ({
      label: c.name,
      value: c.id
    }))

    this.centerOptions = this.units
      .filter(unit => unit.unit_type === 'centro')
      .map(unit => this.toUnitOption(unit))

    this.updateAcademicUnitOptions()
  }

  get coursePlaceholder(): string {
    return 'Todos os cursos'
  }

  get activeCount(): number {
    let n = 0
    if (this.filters.search.trim()) n++
    if (this.filters.areaIds.length) n++
    if (this.filters.courseIds.length) n++
    if (this.filters.centerIds.length) n++
    if (this.filters.academicUnitIds.length) n++
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

    return chips
  }

  private toUnitOption(unit: IOrganizationalUnit): IOption<number> {
    return {
      label: unit.name,
      value: unit.id
    }
  }

  private updateAcademicUnitOptions() {
    const selectedCenterIds = new Set(this.filters.centerIds)
    const academicUnits = this.units.filter(unit => unit.unit_type === 'unidade')
    const visibleAcademicUnits = selectedCenterIds.size
      ? academicUnits.filter(unit => unit.parent_unit_id != null && selectedCenterIds.has(unit.parent_unit_id))
      : academicUnits

    this.academicUnitOptions = visibleAcademicUnits.map(unit => this.toUnitOption(unit))
  }

  onChange() {
    this.filtersChange.emit({ ...this.filters })
  }

  setSort(sort: IProjectFilters['sort']) {
    if (this.filters.sort === sort) return
    this.filters.sort = sort
    this.onChange()
  }

  onCenterChange() {
    this.updateAcademicUnitOptions()
    const visibleAcademicUnitIds = new Set(this.academicUnitOptions.map(option => option.value))
    this.filters.academicUnitIds = this.filters.academicUnitIds.filter(id => visibleAcademicUnitIds.has(id))
    this.onChange()
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
        this.onCenterChange()
        return
      case 'academicUnit':
        this.filters.academicUnitIds = this.filters.academicUnitIds.filter(id => id !== value)
        break
      case 'course':
        this.filters.courseIds = this.filters.courseIds.filter(id => id !== value)
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
