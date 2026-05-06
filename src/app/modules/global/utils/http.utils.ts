import { HttpErrorResponse, HttpParams } from '@angular/common/http'

export function extractHttpErrorDetail(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    const detail = error.error?.detail
    if (typeof detail === 'string') {
      return detail
    }
  }

  return fallback
}

export function buildPaginationParams(page: number, pageSize: number, q?: string): HttpParams {
  let params = new HttpParams().set('page', page).set('page_size', pageSize)
  if (q?.trim()) {
    params = params.set('q', q.trim())
  }

  return params
}
