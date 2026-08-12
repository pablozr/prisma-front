import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { firstValueFrom } from 'rxjs'

import { API_BASE_URL } from '../../global/constants/apiConfig'
import { AppToastService } from '../../global/services/toast/app-toast.service'
import { buildPaginationParams, extractHttpErrorDetail } from '../../global/utils/http.utils'
import {
  IAdminMetrics,
  IAdminProject,
  IAdminProjectUpdate,
  IAdminSyncRun,
  IAdminSyncRunFailure,
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

  async getMetrics(): Promise<IAdminMetrics | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ metrics: IAdminMetrics }>>(`${this.endpoint}/metrics`, this.withCreds)
      )
      return res?.data?.metrics ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar metricas', extractHttpErrorDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async listUsers(page: number, pageSize: number, q?: string): Promise<{ users: IAdminUser[]; pagination: IAdminUsersPagination } | null> {
    try {
      const params = buildPaginationParams(page, pageSize, q)

      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ users: IAdminUser[]; pagination: IAdminUsersPagination }>>(
          `${this.endpoint}/users`,
          { ...this.withCreds, params }
        )
      )
      return res?.data ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar usuarios', extractHttpErrorDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async updateUser(userId: number, payload: { role?: 'admin' | 'professor' | 'tecnico' | 'aluno'; is_active?: boolean }): Promise<IAdminUser | null> {
    try {
      const res = await firstValueFrom(
        this.http.patch<IApiResponse<{ user: IAdminUser }>>(`${this.endpoint}/users/${userId}`, payload, this.withCreds)
      )
      this.toast.success('Usuario atualizado', 'As alteracoes foram salvas com sucesso.')
      return res?.data?.user ?? null
    } catch (err) {
      this.toast.error('Erro ao atualizar usuario', extractHttpErrorDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async listProjects(page: number, pageSize: number, q?: string): Promise<{ projects: IAdminProject[]; pagination: IAdminUsersPagination } | null> {
    try {
      const params = buildPaginationParams(page, pageSize, q)

      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ projects: IAdminProject[]; pagination: IAdminUsersPagination }>>(
          `${this.endpoint}/projects`,
          { ...this.withCreds, params }
        )
      )
      return res?.data ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar projetos', extractHttpErrorDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async updateProject(projectId: number, payload: { publication_status?: 'draft' | 'published' | 'archived'; is_visible?: boolean }): Promise<IAdminProjectUpdate | null> {
    try {
      const res = await firstValueFrom(
        this.http.patch<IApiResponse<{ project: IAdminProjectUpdate }>>(
          `${this.endpoint}/projects/${projectId}`,
          payload,
          this.withCreds
        )
      )
      this.toast.success('Projeto atualizado', 'As alteracoes foram salvas com sucesso.')
      return res?.data?.project ?? null
    } catch (err) {
      this.toast.error('Erro ao atualizar projeto', extractHttpErrorDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async listSyncRuns(page: number, pageSize: number): Promise<{ sync_runs: IAdminSyncRun[]; pagination: IAdminUsersPagination } | null> {
    try {
      const params = buildPaginationParams(page, pageSize)
      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ sync_runs: IAdminSyncRun[]; pagination: IAdminUsersPagination }>>(
          `${this.endpoint}/sync-runs`,
          { ...this.withCreds, params }
        )
      )
      return res?.data ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar sincronizacoes', extractHttpErrorDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async listSyncRunFailures(syncRunId: number, page = 1, pageSize = 20): Promise<{ failures: IAdminSyncRunFailure[]; pagination: IAdminUsersPagination } | null> {
    try {
      const params = buildPaginationParams(page, pageSize)
      const res = await firstValueFrom(
        this.http.get<IApiResponse<{ failures: IAdminSyncRunFailure[]; pagination: IAdminUsersPagination }>>(
          `${this.endpoint}/sync-runs/${syncRunId}/failures`,
          { ...this.withCreds, params }
        )
      )
      return res?.data ?? null
    } catch (err) {
      this.toast.error('Erro ao carregar falhas da sincronizacao', extractHttpErrorDetail(err, 'Tente novamente.'))
      return null
    }
  }
}
