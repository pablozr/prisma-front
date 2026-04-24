import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { catchError, switchMap, throwError } from 'rxjs'
import { API_BASE_URL, AUTH_ROUTES } from '../../constants/apiConfig'
import { UsersService } from '../users/users.service'
import { SessionRefreshService } from './session-refresh.service'

const AUTH_BYPASS_ROUTES = new Set<string>([
  AUTH_ROUTES.login,
  AUTH_ROUTES.googleLogin,
  AUTH_ROUTES.me,
  AUTH_ROUTES.refresh,
  AUTH_ROUTES.logout,
  AUTH_ROUTES.forgetPassword,
  AUTH_ROUTES.validateCode,
  AUTH_ROUTES.updatePassword
])

function shouldTryRefresh(request: HttpRequest<unknown>, error: HttpErrorResponse): boolean {
  if (error.status !== 401) return false
  if (!request.withCredentials) return false
  if (!request.url.startsWith(API_BASE_URL)) return false
  if (AUTH_BYPASS_ROUTES.has(request.url)) return false
  return true
}

function handleSessionExpired(usersService: UsersService, router: Router): void {
  usersService.clearSession()
  const alreadyOnPublicAuthRoute = router.url.startsWith('/signin') || router.url.startsWith('/forget-password')
  if (!alreadyOnPublicAuthRoute) {
    void router.navigate(['/signin'])
  }
}

export const authRefreshInterceptor: HttpInterceptorFn = (request, next) => {
  const usersService = inject(UsersService)
  const router = inject(Router)
  const sessionRefreshService = inject(SessionRefreshService)

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || !shouldTryRefresh(request, error)) {
        return throwError(() => error)
      }

      return sessionRefreshService.refresh().pipe(
        switchMap((refreshed) => {
          if (!refreshed) {
            handleSessionExpired(usersService, router)
            return throwError(() => error)
          }

          return next(request).pipe(
            catchError((retryError: unknown) => {
              if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
                handleSessionExpired(usersService, router)
              }
              return throwError(() => retryError)
            })
          )
        })
      )
    })
  )
}
