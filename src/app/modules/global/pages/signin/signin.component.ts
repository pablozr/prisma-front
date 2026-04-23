import { Component, OnInit, inject } from '@angular/core'
import { InputTextModule } from 'primeng/inputtext'
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms'
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

@Component({
  selector: 'app-signin',
  standalone: true,
  imports: [InputTextModule, ButtonModule, CommonModule, ReactiveFormsModule, RouterLink, LoadingComponent, ButtonThemeComponent, AuthHeroCaptionComponent, RippleModule],
  templateUrl: './signin.component.html',
  styleUrl: './signin.component.scss',
})
export class SigninComponent implements OnInit {
  private router = inject(Router)
  usersServices = inject(UsersService)
  private toast = inject(AppToastService)

  readonly authHeroSrc = AUTH_HERO_IMAGE_PATH

  isLoading = false
  loginForm!: FormGroup
  isInvalid = false
  visiblePassword = false
  activeTab: SigninTab = 'community'

  ngOnInit() {
    this.loginForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.maxLength(128)])
    })
  }

  setTab(tab: SigninTab) {
    if (this.activeTab === tab) return
    this.activeTab = tab
    this.isInvalid = false
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      this.toast.error('Formulário incompleto', 'Indique um e-mail válido e a palavra-passe.')
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
    if (!credential) {
      this.toast.info('Google', 'Aguardando credencial do Google.')
      return
    }
    this.isLoading = true
    const ok = await this.usersServices.signinWithGoogle({ credential })
    this.isLoading = false
    if (ok) this.router.navigate([this.usersServices.getDefaultRoute()])
  }
}
