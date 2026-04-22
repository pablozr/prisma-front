import { inject, Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { AppToastService } from '../toast/app-toast.service'
import { BehaviorSubject } from 'rxjs'
import { Router } from '@angular/router'
import { ISigninData, ISigninRequest, ISigninResponse } from '../../interfaces/ISignin'
import { IUser } from '../../interfaces/IUser'
import { StorageService } from '../local-storage/storage.service'

const mockUser: ISigninData = {
  user: {
    accessId: 1,
    email: 'user@template.com',
    username: 'admin',
    firstName: 'Usuario',
    lastName: 'Template',
    active: true,
    roles: ['ADMIN']
  }
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private http = inject(HttpClient)
  private toast = inject(AppToastService)
  private storageService = inject(StorageService)
  private router = inject(Router)

  private token: string = ''
  private endpoint: string = ''

  private userSubject = new BehaviorSubject<ISigninData | null>(null)
  user$ = this.userSubject.asObservable()

  get currentUser(): ISigninData | null {
    return this.userSubject.value
  }

  private getHeaders() {
    return new HttpHeaders().set('Authorization', `Bearer ${this.token}`)
  }

  // Auth

  signin(data: ISigninRequest) {
    const emailOk = data.email === 'user@template.com' || data.email === 'admin@template.com'
    if (emailOk && data.password === 'admin') {
      this.userSubject.next(mockUser)
      this.storageService.setLocalStorage('USER-BASIC-TEMPLATE', mockUser, false, false)
      return Promise.resolve(true)
    }

    return new Promise<boolean>((resolve) => {
      this.http.post<ISigninResponse>(`${this.endpoint}/auth/login`, data, { withCredentials: true }).subscribe({
        next: (res) => {
          this.userSubject.next(res.data)
          resolve(true)
        },
        error: (err) => {
          this.toast.error('Sign-in failed', err.error?.detail || 'Invalid credentials.')
          resolve(false)
        }
      })
    })
  }

  logout() {
    return new Promise<boolean>((resolve) => {
      this.http.post(`${this.endpoint}/auth/logout`, {}, { withCredentials: true, headers: this.getHeaders() }).subscribe({
        next: () => {
          this.userSubject.next(null)
          this.storageService.deleteLocalStorage('USER-BASIC-TEMPLATE')
          this.router.navigate(['/signin'])
          resolve(true)
        },
        error: () => {
          this.userSubject.next(null)
          this.storageService.deleteLocalStorage('USER-BASIC-TEMPLATE')
          this.router.navigate(['/signin'])
          resolve(false)
        }
      })
    })
  }

  rehydrateSession() {
    return new Promise<boolean>((resolve) => {
      this.http.get<ISigninResponse>(`${this.endpoint}/auth/me`, { withCredentials: true, headers: this.getHeaders() }).subscribe({
        next: (data) => {
          this.userSubject.next(data.data)
          resolve(true)
        },
        error: () => {
          resolve(false)
        }
      })
    })
  }

  // Forget password flow

  sendEmailForgetPassword(data: any) {
    return new Promise<any>((resolve) => {
      this.http.post<any>(`${this.endpoint}/auth/forget-password`, data).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('E-mail enviado', res.message)
          }
          resolve(res)
        },
        error: (err) => {
          this.toast.error('Erro ao enviar e-mail', err.error?.detail || 'Tente novamente.')
          resolve(false)
        }
      })
    })
  }

  validateHashCode(data: any) {
    return new Promise<boolean>((resolve) => {
      this.http.post<any>(`${this.endpoint}/auth/validate-hash`, data).subscribe({
        next: (res) => {
          if (res?.userId) {
            this.toast.success('Codigo validado', 'Codigo de confirmacao validado.')
            resolve(true)
          } else {
            this.toast.error('Codigo invalido', 'O codigo informado e invalido ou expirou.')
            resolve(false)
          }
        },
        error: (err) => {
          this.toast.error('Codigo invalido', err.error?.detail || 'Tente novamente.')
          resolve(false)
        }
      })
    })
  }

  editPasswordWithOutOldPassword(userId: string, data: any) {
    return new Promise<boolean>((resolve) => {
      this.http.patch<any>(`${this.endpoint}/auth/reset-password/${userId}`, data).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('Senha alterada', 'A senha foi redefinida com sucesso.')
            resolve(true)
          } else {
            this.toast.error('Erro ao alterar senha', 'Ocorreu um erro durante a alteracao.')
            resolve(false)
          }
        },
        error: (err) => {
          this.toast.error('Erro ao alterar senha', err.error?.detail || 'Tente novamente.')
          resolve(false)
        }
      })
    })
  }

  // Users CRUD

  findAllUsers() {
    return new Promise<IUser[]>((resolve) => {
      this.http.get<IUser[]>(`${this.endpoint}/users`, { withCredentials: true, headers: this.getHeaders() }).subscribe({
        next: (data) => resolve(data || []),
        error: (err) => {
          this.toast.error('Erro ao buscar usuarios', err.error?.detail || 'Tente novamente.')
          resolve([])
        }
      })
    })
  }

  findOneUser(userId: number) {
    return new Promise<IUser | null>((resolve) => {
      this.http.get<IUser>(`${this.endpoint}/users/${userId}`, { withCredentials: true, headers: this.getHeaders() }).subscribe({
        next: (data) => resolve(data || null),
        error: (err) => {
          this.toast.error('Erro ao buscar usuario', err.error?.detail || 'Tente novamente.')
          resolve(null)
        }
      })
    })
  }

  createUser(data: any) {
    return new Promise<boolean>((resolve) => {
      this.http.post<any>(`${this.endpoint}/users`, data, { withCredentials: true, headers: this.getHeaders() }).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('Usuario criado', 'O usuario foi criado com sucesso.')
          }
          resolve(!!res)
        },
        error: (err) => {
          this.toast.error('Erro ao criar usuario', err.error?.detail || 'Tente novamente.')
          resolve(false)
        }
      })
    })
  }

  editUser(userId: number, data: any) {
    return new Promise<boolean>((resolve) => {
      this.http.patch<any>(`${this.endpoint}/users/${userId}`, data, { withCredentials: true, headers: this.getHeaders() }).subscribe({
        next: (res) => {
          if (res) {
            this.toast.success('Dados alterados', 'As informacoes foram alteradas com sucesso.')
          }
          resolve(!!res)
        },
        error: (err) => {
          this.toast.error('Erro ao alterar dados', err.error?.detail || 'Tente novamente.')
          resolve(false)
        }
      })
    })
  }

  deleteUser(userId: number) {
    return new Promise<boolean>((resolve) => {
      this.http.delete<any>(`${this.endpoint}/users/${userId}`, { withCredentials: true, headers: this.getHeaders() }).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('Usuario excluido', 'O usuario foi excluido com sucesso.')
          }
          resolve(!!res)
        },
        error: (err) => {
          this.toast.error('Erro ao excluir usuario', err.error?.detail || 'Tente novamente.')
          resolve(false)
        }
      })
    })
  }

  editPassword(data: any) {
    return new Promise<boolean>((resolve) => {
      this.http.patch<any>(`${this.endpoint}/users/password`, data, { withCredentials: true, headers: this.getHeaders() }).subscribe({
        next: (res) => {
          if (res?.message) {
            this.toast.success('Senha alterada', res.message)
          }
          resolve(!!res?.message)
        },
        error: (err) => {
          this.toast.error('Erro ao alterar senha', err.error?.detail || 'Tente novamente.')
          resolve(false)
        }
      })
    })
  }
}
