import { HttpBackend, HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { Observable, of } from 'rxjs'
import { catchError, finalize, map, shareReplay } from 'rxjs/operators'
import { AUTH_ROUTES } from '../../constants/apiConfig'
import { IRefreshResponse } from '../../interfaces/IAuth'

@Injectable({
  providedIn: 'root'
})
export class SessionRefreshService {
  private http = new HttpClient(inject(HttpBackend))
  private refreshInFlight$: Observable<boolean> | null = null

  private withCreds = { withCredentials: true } as const

  refresh(): Observable<boolean> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http.post<IRefreshResponse>(AUTH_ROUTES.refresh, {}, this.withCreds).pipe(
        map(() => true),
        catchError(() => of(false)),
        finalize(() => {
          this.refreshInFlight$ = null
        }),
        shareReplay(1)
      )
    }

    return this.refreshInFlight$
  }
}
