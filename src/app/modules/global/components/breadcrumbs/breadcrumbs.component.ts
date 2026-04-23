import { Component, Input } from '@angular/core'
import { CommonModule } from '@angular/common'
import { RouterLink } from '@angular/router'

export interface IBreadcrumbItem {
  label: string
  route?: string
  icon?: string
}

@Component({
  selector: 'app-breadcrumbs',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './breadcrumbs.component.html',
  styleUrl: './breadcrumbs.component.scss'
})
export class BreadcrumbsComponent {
  @Input() items: IBreadcrumbItem[] = []
  @Input() ariaLabel = 'Navegação estrutural'
}
