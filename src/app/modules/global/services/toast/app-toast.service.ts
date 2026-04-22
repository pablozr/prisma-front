import { inject, Injectable } from '@angular/core'
import { MessageService } from 'primeng/api'

const LIFE_OK = 4200
const LIFE_ERR = 5200
const LIFE_INFO = 3800

@Injectable({ providedIn: 'root' })
export class AppToastService {
  private messageService = inject(MessageService)

  success(summary: string, detail?: string, life = LIFE_OK) {
    this.messageService.add({
      severity: 'success',
      summary,
      detail: detail ?? '',
      life
    })
  }

  error(summary: string, detail?: string, life = LIFE_ERR) {
    this.messageService.add({
      severity: 'error',
      summary,
      detail: detail ?? '',
      life
    })
  }

  info(summary: string, detail?: string, life = LIFE_INFO) {
    this.messageService.add({
      severity: 'info',
      summary,
      detail: detail ?? '',
      life
    })
  }

  warn(summary: string, detail?: string, life = LIFE_INFO) {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail: detail ?? '',
      life
    })
  }
}
