import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Observable, catchError, map, of, throwError } from 'rxjs'
import { API_BASE_URL } from '../../../global/constants/apiConfig'
import { AppToastService } from '../../../global/services/toast/app-toast.service'
import {
  IProfessorCourse,
  IProfessorProject,
  IProfessorProjectAssignment,
  IProfessorProjectsPagination
} from '../../interfaces/IProfessorProject'

interface IApiEnvelope<T> {
  message: string
  data: T
}

interface IProjectsPayload {
  projects?: IProfessorProject[]
  projetos?: IProfessorProject[]
  pagination?: IProfessorProjectsPagination
  paginacao?: IProfessorProjectsPagination
}

interface IAssignmentsPayload {
  atribuicoes?: IProfessorProjectAssignment[]
}

interface ICoursesPayload {
  cursos?: IProfessorCourse[]
  courses?: IProfessorCourse[]
}

interface IProjectPayload {
  projeto?: IProfessorProject
  project?: IProfessorProject
}

@Injectable({ providedIn: 'root' })
export class ProfessorProjectsService {
  private http = inject(HttpClient)
  private toast = inject(AppToastService)
  private withCreds = { withCredentials: true } as const

  listMyProjects(page = 1, pageSize = 10, search = ''): Observable<{
    projects: IProfessorProject[]
    pagination: IProfessorProjectsPagination
  }> {
    let params = new HttpParams().set('page', page).set('page_size', pageSize)
    if (search.trim()) {
      params = params.set('q', search.trim())
    }

    return this.http
      .get<IApiEnvelope<IProjectsPayload>>(`${API_BASE_URL}/me/projects`, {
        ...this.withCreds,
        params
      })
      .pipe(
        map(res => {
          const payload = res?.data
          const projects = payload?.projects || payload?.projetos || []
          const pagination = payload?.pagination || payload?.paginacao || {
            page,
            page_size: pageSize,
            total: projects.length,
            total_pages: 1
          }

          return { projects, pagination }
        }),
        catchError((err: unknown) => {
          this.toast.error('Falha ao carregar projetos', this.extractDetail(err, 'Tente novamente.'))
          return of({
            projects: [],
            pagination: { page, page_size: pageSize, total: 0, total_pages: 1 }
          })
        })
      )
  }

  updateProject(projectId: number, payload: { titulo?: string; descricao?: string; descricao_curta?: string }) {
    return this.http
      .patch<IApiEnvelope<IProjectPayload>>(`${API_BASE_URL}/projects/${projectId}`, payload, this.withCreds)
      .pipe(
        map(res => res?.data?.projeto || res?.data?.project || null),
        catchError((err: unknown) => {
          this.toast.error('Falha ao atualizar projeto', this.extractDetail(err, 'Verifique os dados e tente novamente.'))
          return throwError(() => err)
        })
      )
  }

  updateLogo(projectId: number, payload: { image_url: string; alt_text?: string }) {
    return this.http
      .post(`${API_BASE_URL}/projects/${projectId}/logo`, payload, this.withCreds)
      .pipe(
        map(() => true),
        catchError((err: unknown) => {
          this.toast.error('Falha ao atualizar logo', this.extractDetail(err, 'Nao foi possivel salvar a imagem.'))
          return throwError(() => err)
        })
      )
  }

  listAssignments(projectId: number): Observable<IProfessorProjectAssignment[]> {
    return this.http
      .get<IApiEnvelope<IAssignmentsPayload>>(`${API_BASE_URL}/projects/${projectId}/atribuicoes`, this.withCreds)
      .pipe(
        map(res => res?.data?.atribuicoes || []),
        catchError((err: unknown) => {
          this.toast.error('Falha ao carregar atribuicoes', this.extractDetail(err, 'Tente novamente.'))
          return of([])
        })
      )
  }

  createAssignment(projectId: number, payload: { descricao: string; curso_ids: number[] }) {
    return this.http
      .post(`${API_BASE_URL}/projects/${projectId}/atribuicoes`, payload, this.withCreds)
      .pipe(
        map(() => true),
        catchError((err: unknown) => {
          this.toast.error('Falha ao criar atribuicao', this.extractDetail(err, 'Verifique os campos e tente novamente.'))
          return throwError(() => err)
        })
      )
  }

  listCourses(): Observable<IProfessorCourse[]> {
    return this.http
      .get<IApiEnvelope<ICoursesPayload | IProfessorCourse[]>>(`${API_BASE_URL}/catalogues/cursos`, this.withCreds)
      .pipe(
        map(res => {
          const payload = res?.data
          const courses = Array.isArray(payload) ? payload : payload?.cursos || payload?.courses || []
          return [...courses].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
        }),
        catchError((err: unknown) => {
          this.toast.error('Falha ao carregar cursos', this.extractDetail(err, 'Tente novamente.'))
          return of([])
        })
      )
  }

  deleteAssignment(assignmentId: number) {
    return this.http
      .delete(`${API_BASE_URL}/atribuicoes/${assignmentId}`, this.withCreds)
      .pipe(
        map(() => true),
        catchError((err: unknown) => {
          this.toast.error('Falha ao remover atribuicao', this.extractDetail(err, 'Tente novamente.'))
          return throwError(() => err)
        })
      )
  }

  private extractDetail(err: unknown, fallback: string): string {
    if (err instanceof HttpErrorResponse) {
      const detail = err.error?.detail
      if (typeof detail === 'string') return detail
    }
    return fallback
  }
}
