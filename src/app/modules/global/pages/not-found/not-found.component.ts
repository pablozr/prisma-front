import { Component, inject } from '@angular/core'
import { Router, RouterLink } from '@angular/router'
import { HeaderComponent } from '../../components/header/header.component'
import { ButtonModule } from 'primeng/button'
import { RippleModule } from 'primeng/ripple'

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, HeaderComponent],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  private router = inject(Router)

  goHome() {
    this.router.navigate(['/home'])
  }
}
