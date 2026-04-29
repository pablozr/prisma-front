import { CommonModule } from '@angular/common'
import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Subject, Subscription, interval, takeUntil } from 'rxjs'
import {
  BreadcrumbsComponent,
  IBreadcrumbItem
} from '../../../global/components/breadcrumbs/breadcrumbs.component'
import { HeaderComponent } from '../../../global/components/header/header.component'
import { IContactEmailRequestStatus } from '../../../editais/interfaces/IProject'
import { ProjectsService } from '../../../editais/services/projects/projects.service'

type EmailStatusFilter =
  | 'all'
  | IContactEmailRequestStatus['status']

@Component({
  selector: 'app-student-emails',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, HeaderComponent, BreadcrumbsComponent],
  templateUrl: './student-emails.component.html',
  styleUrl: './student-emails.component.scss'
})
export class StudentEmailsComponent implements OnInit, OnDestroy {
  private projectsService = inject(ProjectsService)
  private destroy$ = new Subject<void>()
  private fetchSubscription?: Subscription

  readonly breadcrumbs: IBreadcrumbItem[] = [
    { label: 'Início', route: '/home', icon: 'pi pi-home' },
    { label: 'Meus emails', icon: 'pi pi-envelope' }
  ]

  readonly statusFilters: Array<{ value: EmailStatusFilter; label: string }> = [
    { value: 'all', label: 'Todos' },
    { value: 'sent', label: 'Enviado' },
    { value: 'queued', label: 'Na fila' },
    { value: 'processing', label: 'Processando' },
    { value: 'failed', label: 'Falhou' },
    { value: 'dead_letter', label: 'Não entregue' }
  ]

  search = ''
  statusFilter: EmailStatusFilter = 'all'
  loading = true
  loadingDetail = false
  requestError = ''

  emails: IContactEmailRequestStatus[] = []
  filteredEmails: IContactEmailRequestStatus[] = []
  selectedEmail: IContactEmailRequestStatus | null = null

  ngOnInit(): void {
    this.refresh()

    interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        if (this.hasPendingEmails()) {
          this.refresh(false)
        }
      })
  }

  ngOnDestroy(): void {
    this.fetchSubscription?.unsubscribe()
    this.destroy$.next()
    this.destroy$.complete()
  }

  refresh(resetLoading = true): void {
    if (resetLoading) {
      this.loading = true
    } else {
      this.loadingDetail = true
    }

    this.requestError = ''
    this.fetchSubscription?.unsubscribe()
    this.fetchSubscription = this.projectsService.getContactEmailsSentByMe().subscribe({
      next: emails => {
        this.emails = [...emails]
        this.applyFilters()
        this.syncSelectedEmail()
        this.loading = false
        this.loadingDetail = false
      },
      error: () => {
        this.requestError = 'Não foi possível carregar seus emails agora. Tente novamente em instantes.'
        this.loading = false
        this.loadingDetail = false
      }
    })
  }

  onSearchChange(): void {
    this.applyFilters()
  }

  onStatusFilterChange(): void {
    this.applyFilters()
  }

  selectEmail(email: IContactEmailRequestStatus): void {
    this.selectedEmail = email
  }

  statusLabel(status: IContactEmailRequestStatus['status']): string {
    const labels: Record<IContactEmailRequestStatus['status'], string> = {
      queued: 'Na fila',
      processing: 'Processando',
      sent: 'Enviado',
      failed: 'Falhou',
      dead_letter: 'Não entregue'
    }

    return labels[status] || status
  }

  statusIcon(status: IContactEmailRequestStatus['status']): string {
    const icons: Record<IContactEmailRequestStatus['status'], string> = {
      queued: 'pi pi-clock',
      processing: 'pi pi-spinner pi-spin',
      sent: 'pi pi-check-circle',
      failed: 'pi pi-exclamation-triangle',
      dead_letter: 'pi pi-times-circle'
    }

    return icons[status] || 'pi pi-info-circle'
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '—'
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }

    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(date)
  }

  get totalSent(): number {
    return this.emails.filter(email => email.status === 'sent').length
  }

  get totalProcessing(): number {
    return this.emails.filter(email => email.status === 'processing' || email.status === 'queued').length
  }

  get totalFailed(): number {
    return this.emails.filter(email => email.status === 'failed' || email.status === 'dead_letter').length
  }

  private applyFilters(): void {
    const term = this.search.trim().toLowerCase()

    this.filteredEmails = this.emails.filter(email => {
      const matchesStatus = this.statusFilter === 'all' || email.status === this.statusFilter
      if (!matchesStatus) {
        return false
      }

      if (!term) {
        return true
      }

      const text = [email.subject, email.body, email.to_email].filter(Boolean).join(' ').toLowerCase()
      return text.includes(term)
    })
  }

  private syncSelectedEmail(): void {
    if (!this.filteredEmails.length) {
      this.selectedEmail = null
      return
    }

    if (!this.selectedEmail) {
      this.selectedEmail = this.filteredEmails[0]
      return
    }

    const updated = this.filteredEmails.find(email => email.request_id === this.selectedEmail?.request_id)
    this.selectedEmail = updated || this.filteredEmails[0]
  }

  private hasPendingEmails(): boolean {
    return this.emails.some(email => email.status === 'queued' || email.status === 'processing')
  }
}
