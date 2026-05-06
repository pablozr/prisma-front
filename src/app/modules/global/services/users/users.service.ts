import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { AppToastService } from '../toast/app-toast.service'
import { BehaviorSubject } from 'rxjs'
import { Router } from '@angular/router'
import { ISigninData, ISigninRequest, ISigninResponse } from '../../interfaces/ISignin'
import {
  IForgetPasswordRequest,
  IForgetPasswordResponse,
  IGoogleLoginRequest,
  IGoogleLoginResponse,
  ILogoutResponse,
  IMeResponse,
  IRefreshResponse,
  IUpdatePasswordRequest,
  IUpdatePasswordResponse,
  IValidateCodeRequest,
  IValidateCodeResponse
} from '../../interfaces/IAuth'
import { IUser } from '../../interfaces/IUser'
import { API_BASE_URL, AUTH_ROUTES } from '../../constants/apiConfig'
import { extractHttpErrorDetail } from '../../utils/http.utils'

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient)
  private toast = inject(AppToastService)
  private router = inject(Router)

  private endpoint: string = API_BASE_URL

  private userSubject = new BehaviorSubject<ISigninData | null>(null)
  user$ = this.userSubject.asObservable()

  private initializedSubject = new BehaviorSubject<boolean>(false)
  /** Emite `true` assim que a primeira tentativa de rehidratação terminou (sucesso ou falha). */
  initialized$ = this.initializedSubject.asObservable()

  get currentUser(): ISigninData | null {
    return this.userSubject.value
  }

  get isInitialized(): boolean {
    return this.initializedSubject.value
  }

  /** Rota inicial conforme o papel do utilizador autenticado. */
  getDefaultRoute(): string {
    return this.currentUser?.user?.role === 'admin' ? '/admin' : '/home'
  }

  private withCreds = { withCredentials: true } as const

  private setSession(session: ISigninData | null) {
    this.userSubject.next(session)
  }

  clearSession() {
    this.setSession(null)
  }

  // ----- Auth -----

  signin(data: ISigninRequest) {

    return new Promise<boolean>((resolve) => {
      this.http.post<ISigninResponse>(AUTH_ROUTES.login, data, this.withCreds).subscribe({
        next: async () => {
          const hydrated = await this.me()
          resolve(hydrated)
        },
        error: err => {
          this.toast.error('Falha no login', extractHttpErrorDetail(err, 'Email ou senha incorretos'))
          resolve(false)
        }
      })
    })
  }

  signinWithGoogle(data: IGoogleLoginRequest) {
    return new Promise<boolean>((resolve) => {
      this.http.post<IGoogleLoginResponse>(AUTH_ROUTES.googleLogin, data, this.withCreds).subscribe({
        next: async () => {
          const hydrated = await this.me()
          resolve(hydrated)
        },
        error: err => {
          this.toast.error('Falha no login', extractHttpErrorDetail(err, 'Nao foi possivel autenticar com o Google.'))
          resolve(false)
        }
      })
    })
  }

  me() {
    return new Promise<boolean>((resolve) => {
      this.http.get<IMeResponse>(AUTH_ROUTES.me, this.withCreds).subscribe({
        next: (res) => {
          if (res?.data?.user) {
            this.setSession({ user: res.data.user })
            resolve(true)
          } else {
            this.setSession(null)
            resolve(false)
          }
        },
        error: () => {
          this.clearSession()
          resolve(false)
        }
      })
    })
  }

  logout() {
    return new Promise<boolean>((resolve) => {
      this.http.post<ILogoutResponse>(AUTH_ROUTES.logout, {}, this.withCreds).subscribe({
        next: () => {
          this.clearSession()
          this.router.navigate(['/signin'])
          resolve(true)
        },
        error: err => {
          this.clearSession()
          this.router.navigate(['/signin'])
          if ((err as { status?: number }).status !== 401) {
            this.toast.error('Falha no logout', extractHttpErrorDetail(err, 'Nao foi possivel encerrar a sessao.'))
          }
          resolve(false)
        }
      })
    })
  }

  refresh() {
    return new Promise<boolean>((resolve) => {
      this.http.post<IRefreshResponse>(AUTH_ROUTES.refresh, {}, this.withCreds).subscribe({
        next: () => resolve(true),
        error: () => resolve(false)
      })
    })
  }

  async rehydrateSession() {
    try {
      const hydrated = await this.me()
      if (hydrated) return true

      const refreshed = await this.refresh()
      if (!refreshed) {
        this.clearSession()
        return false
      }

      return this.me()
    } finally {
      if (!this.initializedSubject.value) this.initializedSubject.next(true)
    }
  }

  // ----- Forget password flow -----

  forgetPassword(data: IForgetPasswordRequest) {
    return new Promise<boolean>((resolve) => {
      this.http.post<IForgetPasswordResponse>(AUTH_ROUTES.forgetPassword, data, this.withCreds).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('E-mail enviado', res.message)
          }
          resolve(true)
        },
        error: err => {
          this.toast.error('Erro ao enviar e-mail', extractHttpErrorDetail(err, 'Tente novamente.'))
          resolve(false)
        }
      })
    })
  }

  validateCode(data: IValidateCodeRequest) {
    return new Promise<boolean>((resolve) => {
      this.http.post<IValidateCodeResponse>(AUTH_ROUTES.validateCode, data, this.withCreds).subscribe({
        next: () => {
          this.toast.success('Codigo validado', 'Codigo de confirmacao validado.')
          resolve(true)
        },
        error: err => {
          this.toast.error('Codigo invalido', extractHttpErrorDetail(err, 'O codigo informado e invalido ou expirou.'))
          resolve(false)
        }
      })
    })
  }

  updatePassword(data: IUpdatePasswordRequest) {
    return new Promise<boolean>((resolve) => {
      this.http.post<IUpdatePasswordResponse>(AUTH_ROUTES.updatePassword, data, this.withCreds).subscribe({
        next: (res) => {
          if (res?.data?.user) {
            this.setSession({ user: res.data.user })
          }
          this.toast.success('Senha alterada', 'A senha foi redefinida com sucesso.')
          resolve(true)
        },
        error: err => {
          this.toast.error('Erro ao alterar senha', extractHttpErrorDetail(err, 'Tente novamente.'))
          resolve(false)
        }
      })
    })
  }

  // ----- Users CRUD -----

  findAllUsers() {
    return new Promise<IUser[]>((resolve) => {
      this.http.get<IUser[]>(`${this.endpoint}/users`, this.withCreds).subscribe({
        next: (data) => resolve(data || []),
        error: err => {
          this.toast.error('Erro ao buscar usuarios', extractHttpErrorDetail(err, 'Tente novamente.'))
          resolve([])
        }
      })
    })
  }

  findOneUser(userId: number) {
    return new Promise<IUser | null>((resolve) => {
      this.http.get<IUser>(`${this.endpoint}/users/${userId}`, this.withCreds).subscribe({
        next: (data) => resolve(data || null),
        error: err => {
          this.toast.error('Erro ao buscar usuario', extractHttpErrorDetail(err, 'Tente novamente.'))
          resolve(null)
        }
      })
    })
  }

  createUser(data: Partial<IUser>) {
    return new Promise<boolean>((resolve) => {
      this.http.post<{ message?: string }>(`${this.endpoint}/users`, data, this.withCreds).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('Usuario criado', 'O usuario foi criado com sucesso.')
          }
          resolve(!!res)
        },
        error: err => {
          this.toast.error('Erro ao criar usuario', extractHttpErrorDetail(err, 'Tente novamente.'))
          resolve(false)
        }
      })
    })
  }

  editUser(userId: number, data: Partial<IUser>) {
    return new Promise<boolean>((resolve) => {
      this.http.patch<IUser>(`${this.endpoint}/users/${userId}`, data, this.withCreds).subscribe({
        next: (res) => {
          if (res) {
            this.toast.success('Dados alterados', 'As informacoes foram alteradas com sucesso.')
          }
          resolve(!!res)
        },
        error: err => {
          this.toast.error('Erro ao alterar dados', extractHttpErrorDetail(err, 'Tente novamente.'))
          resolve(false)
        }
      })
    })
  }

  deleteUser(userId: number) {
    return new Promise<boolean>((resolve) => {
      this.http.delete<{ message?: string }>(`${this.endpoint}/users/${userId}`, this.withCreds).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('Usuario excluido', 'O usuario foi excluido com sucesso.')
          }
          resolve(!!res)
        },
        error: err => {
          this.toast.error('Erro ao excluir usuario', extractHttpErrorDetail(err, 'Tente novamente.'))
          resolve(false)
        }
      })
    })
  }

  editPassword(data: { currentPassword: string; newPassword: string }) {
    return new Promise<boolean>((resolve) => {
      this.http.patch<{ message?: string }>(`${this.endpoint}/users/password`, data, this.withCreds).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('Senha alterada', res.message)
          }
          resolve(!!res?.message)
        },
        error: err => {
          this.toast.error('Erro ao alterar senha', extractHttpErrorDetail(err, 'Tente novamente.'))
          resolve(false)
        }
      })
    })
  }
}
