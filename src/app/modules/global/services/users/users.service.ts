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

  async signin(data: ISigninRequest): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<ISigninResponse>(AUTH_ROUTES.login, data, this.withCreds))
      return await this.me()
    } catch (err) {
      this.toast.error('Falha no login', extractHttpErrorDetail(err, 'Email ou senha incorretos'))
      return false
    }
  }

  async signinWithGoogle(data: IGoogleLoginRequest): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post<IGoogleLoginResponse>(AUTH_ROUTES.googleLogin, data, this.withCreds))
      return await this.me()
    } catch (err) {
      this.toast.error('Falha no login', extractHttpErrorDetail(err, 'Nao foi possivel autenticar com o Google.'))
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

  // ----- Users CRUD -----

  async findAllUsers(): Promise<IUser[]> {
    try {
      const data = await firstValueFrom(this.http.get<IUser[]>(`${this.endpoint}/users`, this.withCreds))
      return data || []
    } catch (err) {
      this.toast.error('Erro ao buscar usuarios', extractHttpErrorDetail(err, 'Tente novamente.'))
      return []
    }
  }

  async findOneUser(userId: number): Promise<IUser | null> {
    try {
      const data = await firstValueFrom(this.http.get<IUser>(`${this.endpoint}/users/${userId}`, this.withCreds))
      return data || null
    } catch (err) {
      this.toast.error('Erro ao buscar usuario', extractHttpErrorDetail(err, 'Tente novamente.'))
      return null
    }
  }

  async createUser(data: Partial<IUser>): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.post<{ message?: string }>(`${this.endpoint}/users`, data, this.withCreds))
      if (res?.message) {
        this.toast.success('Usuario criado', 'O usuario foi criado com sucesso.')
      }
      return !!res
    } catch (err) {
      this.toast.error('Erro ao criar usuario', extractHttpErrorDetail(err, 'Tente novamente.'))
      return false
    }
  }

  async editUser(userId: number, data: Partial<IUser>): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.patch<IUser>(`${this.endpoint}/users/${userId}`, data, this.withCreds))
      if (res) {
        this.toast.success('Dados alterados', 'As informacoes foram alteradas com sucesso.')
      }
      return !!res
    } catch (err) {
      this.toast.error('Erro ao alterar dados', extractHttpErrorDetail(err, 'Tente novamente.'))
      return false
    }
  }

  async deleteUser(userId: number): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.delete<{ message?: string }>(`${this.endpoint}/users/${userId}`, this.withCreds))
      if (res?.message) {
        this.toast.success('Usuario excluido', 'O usuario foi excluido com sucesso.')
      }
      return !!res
    } catch (err) {
      this.toast.error('Erro ao excluir usuario', extractHttpErrorDetail(err, 'Tente novamente.'))
      return false
    }
  }

  async editPassword(data: { currentPassword: string; newPassword: string }): Promise<boolean> {
    try {
      const res = await firstValueFrom(this.http.patch<{ message?: string }>(`${this.endpoint}/users/password`, data, this.withCreds))
      if (res?.message) {
        this.toast.success('Senha alterada', res.message)
      }
      return !!res?.message
    } catch (err) {
      this.toast.error('Erro ao alterar senha', extractHttpErrorDetail(err, 'Tente novamente.'))
      return false
    }
  }
}
