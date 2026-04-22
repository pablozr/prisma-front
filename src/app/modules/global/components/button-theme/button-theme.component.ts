import { CommonModule } from '@angular/common'
import { Component, HostBinding, Input, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { ThemeService } from '../../services/theme/theme.service'
import { ToggleButtonModule } from 'primeng/togglebutton'

@Component({
  selector: 'app-button-theme',
  standalone: true,
  imports: [ToggleButtonModule, FormsModule, CommonModule],
  templateUrl: './button-theme.component.html',
  styleUrl: './button-theme.component.scss'
})
export class ButtonThemeComponent implements OnInit {
  themeService = inject(ThemeService)

  /** Icon-only FAB (e.g. auth screens) */
  @Input() compact = false

  @HostBinding('class.button-theme--compact')
  get compactClass() {
    return this.compact
  }

  themeData!: string
  isDarkTheme: boolean = true

  ngOnInit() {
    this.themeService.themeInformation.subscribe(data => {
      this.themeData = data;

      if (data == 'dark'){
        this.isDarkTheme = true;
      } else {
        this.isDarkTheme = false;
      }
    });
  }

  toggleLightDark() {
    this.themeService.toggleDarkMode()
  }
}
