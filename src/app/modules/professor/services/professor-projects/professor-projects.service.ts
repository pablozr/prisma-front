import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Observable, catchError, map, of, throwError } from 'rxjs'
import { API_BASE_URL } from '../../../global/constants/apiConfig'
import { AppToastService } from '../../../global/services/toast/app-toast.service'
import { buildPaginationParams, extractHttpErrorDetail } from '../../../global/utils/http.utils'
import {
  IManagedProject,
  IManagedProjectUpdate,
  IProfessorProjectOpportunity,
  IProfessorProjectsPagination
} from '../../interfaces/IProfessorProject'

interface IApiEnvelope<T> {
  message: string
  data: T
}

interface IManagedProjectsPayload {
  projetos: IManagedProject[]
  paginacao: IProfessorProjectsPagination
}

interface IManagedProjectPayload {
  projeto: IManagedProject
}

interface IManagedProjectUpdatePayload {
  projeto: IManagedProjectUpdate
}

interface IProjectLogoPayload {
  logo: {
    projeto_id: number
    image_url: string
    alt_text: string | null
  }
}

interface IProjectOpportunityPayload {
  opportunity: IProfessorProjectOpportunity
}

@Injectable({ providedIn: 'root' })
export class ProfessorProjectsService {
  private http = inject(HttpClient)
  private toast = inject(AppToastService)
  private withCreds = { withCredentials: true } as const

  listMyProjects(page = 1, pageSize = 10, search = ''): Observable<{
    projects: IManagedProject[]
    pagination: IProfessorProjectsPagination
  }> {
    const params = buildPaginationParams(page, pageSize, search)

    return this.http.get<IApiEnvelope<IManagedProjectsPayload>>(`${API_BASE_URL}/me/projects`, { ...this.withCreds, params }).pipe(
      map(res => ({ projects: res.data.projetos, pagination: res.data.paginacao })),
      catchError((err: unknown) => {
        this.toast.error('Falha ao carregar projetos', extractHttpErrorDetail(err, 'Tente novamente.'))
        return of({ projects: [], pagination: { page, page_size: pageSize, total: 0, total_pages: 1 } })
      })
    )
  }

  getMyProject(projectId: number): Observable<IManagedProject | null> {
    return this.http.get<IApiEnvelope<IManagedProjectPayload>>(`${API_BASE_URL}/me/projects/${projectId}`, this.withCreds).pipe(
      map(res => res.data.projeto),
      catchError((err: unknown) => {
        this.toast.error('Falha ao carregar projeto', extractHttpErrorDetail(err, 'Tente novamente.'))
        return of(null)
      })
    )
  }

  updateProject(projectId: number, payload: { descricao?: string | null; descricao_curta?: string | null }) {
    return this.http.patch<IApiEnvelope<IManagedProjectUpdatePayload>>(`${API_BASE_URL}/projects/${projectId}`, payload, this.withCreds).pipe(
      map(res => res.data.projeto),
      catchError((err: unknown) => {
        this.toast.error('Falha ao atualizar projeto', extractHttpErrorDetail(err, 'Verifique os dados e tente novamente.'))
        return throwError(() => err)
      })
    )
  }

  updateLogo(projectId: number, image: File, altText?: string) {
    const formData = new FormData()
    formData.append('image', image)
    if (altText) formData.append('alt_text', altText)

    return this.http.post<IApiEnvelope<IProjectLogoPayload>>(`${API_BASE_URL}/projects/${projectId}/logo`, formData, this.withCreds).pipe(
      map(res => res.data.logo),
      catchError((err: unknown) => {
        this.toast.error('Falha ao atualizar logo', extractHttpErrorDetail(err, 'Nao foi possivel salvar a imagem.'))
        return throwError(() => err)
      })
    )
  }

  createOpportunity(projectId: number, payload: { descricao: string; curso_ids: number[] }) {
    return this.http.post<IApiEnvelope<IProjectOpportunityPayload>>(`${API_BASE_URL}/projects/${projectId}/opportunities`, payload, this.withCreds).pipe(
      map(res => res.data.opportunity),
      catchError((err: unknown) => {
        this.toast.error('Falha ao criar oportunidade', extractHttpErrorDetail(err, 'Verifique os campos e tente novamente.'))
        return throwError(() => err)
      })
    )
  }

  deleteOpportunity(opportunityId: number) {
    return this.http.delete(`${API_BASE_URL}/opportunities/${opportunityId}`, this.withCreds).pipe(
      map(() => true),
      catchError((err: unknown) => {
        this.toast.error('Falha ao remover oportunidade', extractHttpErrorDetail(err, 'Tente novamente.'))
        return throwError(() => err)
      })
    )
  }
}
