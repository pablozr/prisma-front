import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { API_BASE_URL } from '../../global/constants/apiConfig'
import { AppToastService } from '../../global/services/toast/app-toast.service'
import { IAdminMetrics, IAdminUser, IAdminUsersPagination } from '../interfaces/IAdmin'

interface IApiResponse<T> {
  message: string
  data: T
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private http = inject(HttpClient)
  private toast = inject(AppToastService)

  private withCreds = { withCredentials: true } as const
  private endpoint = `${API_BASE_URL}/admin`

  private extractDetail(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const detail = err.error?.detail
      if (typeof detail === 'string') return detail
    }
    return fallback
  }

  async getMetrics(): Promise<IAdminMetrics | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ metrics: IAdminMetrics }>>(`${this.endpoint}/metrics`, this.withCreds)
      )
      return res?.data?.metrics ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar metricas', this.extractDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async listUsers(page: number, pageSize: number, q?: string): Promise<{ users: IAdminUser[]; pagination: IAdminUsersPagination } | null> {
    try {
      let params = new HttpParams().set('page', page).set('page_size', pageSize)
      if (q?.trim()) {
        params = params.set('q', q.trim())
      }

      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ users: IAdminUser[]; pagination: IAdminUsersPagination }>>(
          `${this.endpoint}/users`,
          { ...this.withCreds, params }
        )
      )
      return res?.data ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar usuarios', this.extractDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async updateUser(userId: number, payload: { role?: 'admin' | 'professor' | 'tecnico'; is_active?: boolean }): Promise<IAdminUser | null> {
    try {
      const res = await firstValueFrom(
        this.http.patch<IApiResponse<{ user: IAdminUser }>>(`${this.endpoint}/users/${userId}`, payload, this.withCreds)
      )
      this.toast.success('Usuario atualizado', 'As alteracoes foram salvas com sucesso.')
      return res?.data?.user ?? null
    } catch (err) {
      this.toast.error('Erro ao atualizar usuario', this.extractDetail(err, 'Tente novamente.'))
      return null
    }
  }
}
