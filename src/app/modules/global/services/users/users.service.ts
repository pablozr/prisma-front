import { inject, Injectable } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { AppToastService } from '../toast/app-toast.service'
import { BehaviorSubject } from 'rxjs'
import { firstValueFrom } from 'rxjs'
import { Router } from '@angular/router'
import { ISigninData, ISigninRequest, ISigninResponse } from '../../interfaces/ISignin'
import {
  IForgetPasswordRequest,
  IForgetPasswordResponse,
  ILogoutResponse,
  IMeResponse,
  IRefreshResponse,
  IUpdatePasswordRequest,
  IUpdatePasswordResponse,
  IValidateCodeRequest,
  IValidateCodeResponse
} from '../../interfaces/IAuth'
import { AUTH_ROUTES } from '../../constants/apiConfig'
import { extractHttpErrorDetail } from '../../utils/http.utils'

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient)
  private toast = inject(AppToastService)
  private router = inject(Router)

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

  /** Rota inicial conforme o perfil da pessoa autenticada. */
  getDefaultRoute(): string {
    const role = this.currentUser?.user?.role
    if (role === 'admin') return '/admin'
    if (role === 'professor' || role === 'tecnico') return '/my-projects'
    return '/home'
  }

  private withCreds = { withCredentials: true } as const

  private setSession(session: ISigninData | null) {
    this.userSubject.next(session)
  }

  clearSession() {
    this.setSession(null)
  }

  // ----- Auth -----

  async signin(data: ISigninRequest): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<ISigninResponse>(AUTH_ROUTES.login, data, this.withCreds))
      return await this.me()
    } catch (err) {
      this.toast.error('Falha no login', extractHttpErrorDetail(err, 'Email ou senha incorretos'))
      return false
    }
  }

  async me(): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.get<IMeResponse>(AUTH_ROUTES.me, this.withCreds))
      if (res?.data?.user) {
        this.setSession({ user: res.data.user })
        return true
      }
      this.setSession(null)
      return false
    } catch {
      this.clearSession()
      return false
    }
  }

  async logout(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<ILogoutResponse>(AUTH_ROUTES.logout, {}, this.withCreds))
      this.clearSession()
      await this.router.navigate(['/signin'])
      return true
    } catch (err) {
      this.clearSession()
      await this.router.navigate(['/signin'])
      if ((err as { status?: number }).status !== 401) {
        this.toast.error('Falha no logout', extractHttpErrorDetail(err, 'Nao foi possivel encerrar a sessao.'))
      }
      return false
    }
  }

  async refresh(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<IRefreshResponse>(AUTH_ROUTES.refresh, {}, this.withCreds))
      return true
    } catch {
      return false
    }
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

  async forgetPassword(data: IForgetPasswordRequest): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.post<IForgetPasswordResponse>(AUTH_ROUTES.forgetPassword, data, this.withCreds))
      if (res?.message) {
        this.toast.success('E-mail enviado', res.message)
      }
      return true
    } catch (err) {
      this.toast.error('Erro ao enviar e-mail', extractHttpErrorDetail(err, 'Tente novamente.'))
      return false
    }
  }

  async validateCode(data: IValidateCodeRequest): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<IValidateCodeResponse>(AUTH_ROUTES.validateCode, data, this.withCreds))
      this.toast.success('Codigo validado', 'Codigo de confirmacao validado.')
      return true
    } catch (err) {
      this.toast.error('Codigo invalido', extractHttpErrorDetail(err, 'O codigo informado e invalido ou expirou.'))
      return false
    }
  }

  async updatePassword(data: IUpdatePasswordRequest): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.post<IUpdatePasswordResponse>(AUTH_ROUTES.updatePassword, data, this.withCreds))
      if (res?.data?.user) {
        this.setSession({ user: res.data.user })
      }
      this.toast.success('Senha alterada', 'A senha foi redefinida com sucesso.')
      return true
    } catch (err) {
      this.toast.error('Erro ao alterar senha', extractHttpErrorDetail(err, 'Tente novamente.'))
      return false
    }
  }

}
