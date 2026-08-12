import { EditalFiltersComponent } from './edital-filters.component'

describe('EditalFiltersComponent', () => {
  it('shows academic units only for the selected parent centers', () => {
    const component = new EditalFiltersComponent()
    component.filters = { search: '', areaIds: [], courseIds: [], centerIds: [10], academicUnitIds: [], sort: 'recent' }
    component.units = [
      { id: 10, name: 'Centro A', unit_type: 'centro' },
      { id: 11, name: 'Centro B', unit_type: 'centro' },
      { id: 20, name: 'Unidade A', unit_type: 'unidade', parent_unit_id: 10 },
      { id: 21, name: 'Unidade B', unit_type: 'unidade', parent_unit_id: 11 }
    ]

    component.ngOnChanges()

    expect(component.academicUnitOptions).toEqual([{ label: 'Unidade A', value: 20 }])
  })

  it('clears selected units that do not belong to the newly selected centers', () => {
    const component = new EditalFiltersComponent()
    component.filters = { search: '', areaIds: [], courseIds: [], centerIds: [11], academicUnitIds: [20, 21], sort: 'recent' }
    component.units = [
      { id: 10, name: 'Centro A', unit_type: 'centro' },
      { id: 11, name: 'Centro B', unit_type: 'centro' },
      { id: 20, name: 'Unidade A', unit_type: 'unidade', parent_unit_id: 10 },
      { id: 21, name: 'Unidade B', unit_type: 'unidade', parent_unit_id: 11 }
    ]
    spyOn(component.filtersChange, 'emit')

    component.onCenterChange()

    expect(component.filters.academicUnitIds).toEqual([21])
    expect(component.filtersChange.emit).toHaveBeenCalledWith(jasmine.objectContaining({ centerIds: [11], academicUnitIds: [21] }))
  })
})
