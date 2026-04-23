import { Component } from '@angular/core'
import { HelpDialogComponent } from '../help-dialog/help-dialog.component'

@Component({
  selector: 'app-help-fab',
  standalone: true,
  imports: [HelpDialogComponent],
  templateUrl: './help-fab.component.html',
  styleUrl: './help-fab.component.scss'
})
export class HelpFabComponent {
  open = false

  toggle() {
    this.open = !this.open
  }
}
