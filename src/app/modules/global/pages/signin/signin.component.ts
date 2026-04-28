import { Component, OnInit, inject } from '@angular/core'
import { InputTextModule } from 'primeng/inputtext'
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { ButtonModule } from 'primeng/button'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { CommonModule } from '@angular/common'
import { AUTH_HERO_IMAGE_PATH } from '../../constants/authHeroImagePath'
import { AppToastService } from '../../services/toast/app-toast.service'
import { ButtonThemeComponent } from '../../components/button-theme/button-theme.component'
import { AuthHeroCaptionComponent } from '../../components/auth-hero-caption/auth-hero-caption.component'
import { LoadingComponent } from '../../components/loading/loading.component'
import { UsersService } from '../../services/users/users.service'
import { RippleModule } from 'primeng/ripple'
import { environment } from '../../../../../environments/environment'

type SigninTab = 'community' | 'admin'

type LoginErrorToast = {
  title: string
  message: string
}

const LOGIN_ERROR_TOASTS: Record<string, LoginErrorToast> = {
  google_auth_failed: {
    title: 'Falha na autenticacao Google',
    message: 'Nao foi possivel autenticar com Google. Verifique se voce usou uma conta institucional da UNIRIO.'
  },
  google_auth_cancelled: {
    title: 'Login Google cancelado',
    message: 'A autenticacao com Google foi cancelada. Tente novamente para continuar.'
  }
}

const DEFAULT_LOGIN_ERROR_TOAST: LoginErrorToast = {
  title: 'Nao foi possivel entrar',
  message: 'Ocorreu um erro durante a autenticacao. Tente novamente em instantes.'
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
export class SigninComponent implements OnInit {
  private readonly route = inject(ActivatedRoute)
  private router = inject(Router)
  usersServices = inject(UsersService)
  private toast = inject(AppToastService)

  readonly authHeroSrc = AUTH_HERO_IMAGE_PATH

  isLoading = false
  loginForm!: FormGroup
  isInvalid = false
  visiblePassword = false
  activeTab: SigninTab = 'community'
  googleLoginLoading = false

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(254), noEdgeWhitespace]),
      password: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(128), noEdgeWhitespace])
    })

    const loginError = this.route.snapshot.queryParamMap.get('error')
    if (loginError) {
      const errorToast = LOGIN_ERROR_TOASTS[loginError] ?? DEFAULT_LOGIN_ERROR_TOAST
      this.toast.error(errorToast.title, errorToast.message)
      this.activeTab = 'community'
      this.googleLoginLoading = false
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }

  setTab(tab: SigninTab) {
    if (this.activeTab === tab) return
    this.activeTab = tab
    this.isInvalid = false
    if (tab === 'admin') {
      this.googleLoginLoading = false
    }
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

  loginWithGoogle() {
    if (this.googleLoginLoading) {
      return
    }

    this.googleLoginLoading = true
    window.location.href = `${environment.apiUrl}/auth/google/start`
  }
}
