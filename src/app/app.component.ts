import { Component } from '@angular/core'
import { Router, RouterOutlet } from '@angular/router'
import { PrimeNG } from 'primeng/config'
import { ThemeService } from './modules/global/services/theme/theme.service'
import { UsersService } from './modules/global/services/users/users.service'
import { ToastModule } from 'primeng/toast'
import { NotificationsService } from './modules/global/services/notifications/notifications.service'
import { NotificationDialogComponent } from './modules/global/components/notification-dialog/notification-dialog.component'
import { HelpFabComponent } from './modules/global/components/help-fab/help-fab.component'

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule, NotificationDialogComponent, HelpFabComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'PRISMA — UNIRIO'

  private readonly fabHiddenPrefixes = ['/signin', '/forget-password']

  constructor(
    private primeng: PrimeNG,
    private themeService: ThemeService,
    usersService: UsersService,
    private notificationsService: NotificationsService,
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
