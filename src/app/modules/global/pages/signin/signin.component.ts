import { Component, OnDestroy, OnInit, inject } from '@angular/core'
import { InputTextModule } from 'primeng/inputtext'
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { ButtonModule } from 'primeng/button'
import { Router, RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'
import { AUTH_HERO_IMAGE_PATH } from '../../constants/authHeroImagePath'
import { AppToastService } from '../../services/toast/app-toast.service'
import { ButtonThemeComponent } from '../../components/button-theme/button-theme.component'
import { AuthHeroCaptionComponent } from '../../components/auth-hero-caption/auth-hero-caption.component'
import { LoadingComponent } from '../../components/loading/loading.component'
import { UsersService } from '../../services/users/users.service'
import { RippleModule } from 'primeng/ripple'

type SigninTab = 'community' | 'admin'

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize(config: { client_id: string; callback: (response: { credential?: string }) => void }): void
          prompt(): void
        }
      }
    }
    SIEPA_GOOGLE_CLIENT_ID?: string
  }
}

const noEdgeWhitespace: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string | null
  if (!value) return null
  return value === value.trim() ? null : { whitespaceEdges: true }
}

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [InputTextModule, ButtonModule, CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent, ButtonThemeComponent, AuthHeroCaptionComponent, RippleModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComponent implements OnInit, OnDestroy {
  private router = inject(Router)
  usersServices = inject(UsersService)
  private toast = inject(AppToastService)

  readonly authHeroSrc = AUTH_HERO_IMAGE_PATH

  isLoading = false
  loginForm!: FormGroup
  isInvalid = false
  visiblePassword = false
  activeTab: SigninTab = 'community'
  private googleScriptEl?: HTMLScriptElement
  private googleReady = false

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(254), noEdgeWhitespace]),
      password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(128), noEdgeWhitespace])
    })

    this.loadGoogleScript()
  }

  ngOnDestroy() {
    if (this.googleScriptEl) {
      this.googleScriptEl.remove()
      this.googleScriptEl = undefined
    }
  }

  setTab(tab: SigninTab) {
    if (this.activeTab === tab) return
    this.activeTab = tab
    this.isInvalid = false
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.toast.error('Formulario invalido', 'Use um e-mail valido e uma palavra-passe entre 8 e 128 caracteres, sem espacos nas extremidades.')
      return
    }
    this.isLoading = true
    const email = (this.loginForm.value.email as string).trim().toLowerCase()
    const password = (this.loginForm.value.password as string).trim()
    const response = await this.usersServices.signin({ email, password })
    this.isInvalid = true
    this.isLoading = false

    if (response) {
      this.isInvalid = false
      this.router.navigate([this.usersServices.getDefaultRoute()])
    }
  }

  togglePassword() {
    this.visiblePassword = !this.visiblePassword
  }

  async signinWithGoogle(credential?: string) {
    if (!credential && !this.googleReady) {
      this.toast.info('Google', 'A inicializacao do Google ainda nao terminou.')
      return
    }

    if (!credential) {
      window.google?.accounts?.id?.prompt()
      return
    }

    this.isLoading = true
    const ok = await this.usersServices.signinWithGoogle({ credential })
    this.isLoading = false
    if (ok) this.router.navigate([this.usersServices.getDefaultRoute()])
  }

  private loadGoogleScript() {
    if (window.google?.accounts?.id) {
      this.setupGoogleClient()
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => this.setupGoogleClient()
    script.onerror = () => this.toast.error('Google indisponivel', 'Nao foi possivel carregar a autenticacao Google.')
    document.head.appendChild(script)
    this.googleScriptEl = script
  }

  private setupGoogleClient() {
    const clientId = window.SIEPA_GOOGLE_CLIENT_ID

    if (!clientId) {
      this.toast.error('Google nao configurado', 'Defina window.SIEPA_GOOGLE_CLIENT_ID para habilitar o login com Google.')
      return
    }

    const googleClient = window.google?.accounts?.id
    if (!googleClient) {
      this.toast.error('Google indisponivel', 'Nao foi possivel inicializar o cliente do Google.')
      return
    }

    googleClient.initialize({
      client_id: clientId,
      callback: ({ credential }) => {
        if (credential) {
          this.signinWithGoogle(credential)
          return
        }

        this.toast.error('Google', 'Nao foi possivel obter a credencial da conta Google.')
      }
    })

    this.googleReady = true
  }
}
