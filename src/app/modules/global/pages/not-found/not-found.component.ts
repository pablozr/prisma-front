import { Component, inject } from '@angular/core'
import { Router } from '@angular/router'
import { ButtonModule } from 'primeng/button'
import { RippleModule } from 'primeng/ripple'

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [ButtonModule, RippleModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  private router = inject(Router)

  goHome() {
    this.router.navigate(['/home'])
  }
}
