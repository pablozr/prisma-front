import { Component } from '@angular/core'
import { Router, RouterOutlet, RouterLink } from '@angular/router'
import { PrimeNG } from 'primeng/config'
import { ToastModule } from 'primeng/toast'
import { HelpFabComponent } from './modules/global/components/help-fab/help-fab.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, HelpFabComponent, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'PRISMA — UNIRIO'

  private readonly fabHiddenPrefixes = ['/signin']

  constructor(
    private primeng: PrimeNG,
    private router: Router
  ) {}

  get showHelpFab(): boolean {
    const path = this.router.url.split('?')[0].split('#')[0]
    return !this.fabHiddenPrefixes.some(prefix => path.startsWith(prefix))
  }

  ngOnInit() {
    this.primeng.ripple.set(true)
  }
}
