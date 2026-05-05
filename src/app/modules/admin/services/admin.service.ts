import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { API_BASE_URL } from '../../global/constants/apiConfig'
import { AppToastService } from '../../global/services/toast/app-toast.service'
import {
  IAdminImportBatch,
  IAdminImportError,
  IAdminMetrics,
  IAdminProject,
  IAdminUser,
  IAdminUsersPagination
} from '../interfaces/IAdmin'

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

  async listProjects(page: number, pageSize: number, q?: string): Promise<{ projects: IAdminProject[]; pagination: IAdminUsersPagination } | null> {
    try {
      let params = new HttpParams().set('page', page).set('page_size', pageSize)
      if (q?.trim()) {
        params = params.set('q', q.trim())
      }

      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ projects: IAdminProject[]; pagination: IAdminUsersPagination }>>(
          `${this.endpoint}/projects`,
          { ...this.withCreds, params }
        )
      )
      return res?.data ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar projetos', this.extractDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async updateProject(projectId: number, payload: { status?: 'draft' | 'published' | 'archived'; is_active?: boolean }): Promise<IAdminProject | null> {
    try {
      const res = await firstValueFrom(
        this.http.patch<IApiResponse<{ project: IAdminProject }>>(
          `${this.endpoint}/projects/${projectId}`,
          payload,
          this.withCreds
        )
      )
      this.toast.success('Projeto atualizado', 'As alteracoes foram salvas com sucesso.')
      return res?.data?.project ?? null
    } catch (err) {
      this.toast.error('Erro ao atualizar projeto', this.extractDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async uploadImport(file: File): Promise<IAdminImportBatch | null> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await firstValueFrom(
        this.http.post<IApiResponse<{ batch: IAdminImportBatch }>>(`${this.endpoint}/imports`, formData, this.withCreds)
      )
      this.toast.success('Importacao concluida', 'Arquivo processado com sucesso.')
      return res?.data?.batch ?? null
    } catch (err) {
      this.toast.error('Erro na importacao', this.extractDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async listImports(page: number, pageSize: number): Promise<{ batches: IAdminImportBatch[]; pagination: IAdminUsersPagination } | null> {
    try {
      const params = new HttpParams().set('page', page).set('page_size', pageSize)
      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ batches: IAdminImportBatch[]; pagination: IAdminUsersPagination }>>(
          `${this.endpoint}/imports`,
          { ...this.withCreds, params }
        )
      )
      return res?.data ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar importacoes', this.extractDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async listImportErrors(batchId: number, page = 1, pageSize = 20): Promise<IAdminImportError[]> {
    try {
      const params = new HttpParams().set('page', page).set('page_size', pageSize)
      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ errors: IAdminImportError[] }>>(
          `${this.endpoint}/imports/${batchId}/errors`,
          { ...this.withCreds, params }
        )
      )
      return res?.data?.errors ?? []
    } catch (err) {
      this.toast.error('Erro ao carregar erros da importacao', this.extractDetail(err, 'Tente novamente.'))
      return []
    }
  }
}
