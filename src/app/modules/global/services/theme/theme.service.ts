import { Injectable, inject } from '@angular/core'
import { BehaviorSubject } from 'rxjs'
import { StorageService } from '../local-storage/storage.service'

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private localStorage = inject(StorageService)
  private theme = new BehaviorSubject<string>('light')
  themeInformation = this.theme.asObservable()

  constructor() {
    const saved = this.localStorage.getLocalStorage('THEME-BASIC-TEMPLATE')
    this.applyTheme(saved === 'dark' ? 'dark' : 'light')
  }

  toggleDarkMode() {
    const next = this.theme.value === 'dark' ? 'light' : 'dark'
    this.localStorage.setNormalLocalStorage('THEME-BASIC-TEMPLATE', next)
    this.applyTheme(next)
  }

  private applyTheme(theme: string) {
    document.documentElement.classList.toggle('my-app-dark', theme === 'dark')
    this.theme.next(theme)
  }
}
