import { UsersService } from './../../services/users/users.service'
import { Component, OnInit, inject } from '@angular/core'
import { MenuItem } from 'primeng/api'
import { AppToastService } from '../../services/toast/app-toast.service'
import { StepsModule } from 'primeng/steps'
import { ButtonModule } from 'primeng/button'
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms'
import { InputTextModule } from 'primeng/inputtext'
import { Router } from '@angular/router'
import { CommonModule } from '@angular/common'
import { LoadingComponent } from '../../components/loading/loading.component'
import { RippleModule } from 'primeng/ripple'
import { ButtonThemeComponent } from '../../components/button-theme/button-theme.component'
import { AuthHeroCaptionComponent } from '../../components/auth-hero-caption/auth-hero-caption.component'
import { AUTH_HERO_IMAGE_PATH } from '../../constants/authHeroImagePath'

const strongPassword: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string | null
  if (!value) return null

  const errors: ValidationErrors = {}
  if (value !== value.trim()) errors['whitespaceEdges'] = true
  if (/\s/.test(value)) errors['whitespaceInside'] = true
  if (!/[A-Z]/.test(value)) errors['uppercase'] = true
  if (!/[a-z]/.test(value)) errors['lowercase'] = true
  if (!/[0-9]/.test(value)) errors['number'] = true
  if (!/[^A-Za-z0-9]/.test(value)) errors['special'] = true

  return Object.keys(errors).length ? errors : null
}

const noEdgeWhitespace: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value = control.value as string | null
  if (!value) return null
  return value === value.trim() ? null : { whitespaceEdges: true }
}

const matchPasswords: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const newPassword = group.get('newPassword')?.value
  const confirm = group.get('passwordConfirm')?.value
  return newPassword && confirm && newPassword !== confirm ? { passwordMismatch: true } : null
}

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [StepsModule, ButtonModule, ReactiveFormsModule, InputTextModule, CommonModule, LoadingComponent, RippleModule, ButtonThemeComponent, AuthHeroCaptionComponent],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent implements OnInit {
  usersServices = inject(UsersService)

  private router = inject(Router)
  private toast = inject(AppToastService)

  readonly authHeroSrc = AUTH_HERO_IMAGE_PATH

  isLoading = false

  isInvalidEmail = false
  isInvalidHash = false
  isInvalidNewPassword = false
  isInvalidPasswordConfirm = false

  items: MenuItem[] | undefined
  active = 0

  forgetPasswordEmailForm!: FormGroup
  forgetPasswordHashForm!: FormGroup
  forgetPasswordNewPasswordForm!: FormGroup

  ngOnInit() {
    this.items = [
      { label: 'Email' },
      { label: 'Codigo' },
      { label: 'Nova Senha' }
    ]

    this.forgetPasswordEmailForm = new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email, Validators.maxLength(254), noEdgeWhitespace])
    })

    this.forgetPasswordHashForm = new FormGroup({
      hash: new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)])
    })

    this.forgetPasswordNewPasswordForm = new FormGroup(
      {
        newPassword: new FormControl('', [Validators.required, Validators.minLength(8), Validators.maxLength(128), noEdgeWhitespace, strongPassword]),
        passwordConfirm: new FormControl('', [Validators.required])
      },
      { validators: matchPasswords }
    )
  }

  navigateTo(route: string) {
    this.router.navigate([route])
  }

  async onSubmitEmail() {
    if (this.forgetPasswordEmailForm.invalid) {
      this.toast.error('E-mail invalido', 'Informe um endereco de e-mail valido.')
      this.isInvalidEmail = true
      return
    }

    this.isLoading = true
    const email = (this.forgetPasswordEmailForm.value.email as string).trim().toLowerCase()
    const ok = await this.usersServices.forgetPassword({ email })
    this.isLoading = false

    if (ok) {
      this.active = 1
      this.isInvalidEmail = false
    } else {
      this.isInvalidEmail = true
    }
  }

  async onSubmitHashCode() {
    if (this.forgetPasswordHashForm.invalid) {
      this.toast.error('Codigo invalido', 'O codigo deve conter exatamente 6 digitos.')
      this.isInvalidHash = true
      return
    }

    this.isLoading = true
    const code = this.forgetPasswordHashForm.value.hash as string
    const ok = await this.usersServices.validateCode({ code })
    this.isLoading = false

    if (ok) {
      this.active = 2
      this.isInvalidHash = false
    } else {
      this.isInvalidHash = true
    }
  }

  async onSubmitNewPassword() {
    const form = this.forgetPasswordNewPasswordForm
    const mismatch = form.errors?.['passwordMismatch']

    if (form.invalid || mismatch) {
      if (mismatch) {
        this.toast.error('Senhas diferentes', 'A confirmacao nao coincide com a nova senha.')
        this.isInvalidPasswordConfirm = true
      } else {
        this.toast.error('Senha invalida', 'A senha deve ter 8 a 128 caracteres, sem espacos, com maiuscula, minuscula, numero e caractere especial.')
        this.isInvalidNewPassword = true
      }
      return
    }

    this.isLoading = true
    const password = form.value.newPassword as string
    const ok = await this.usersServices.updatePassword({ password })
    this.isLoading = false

    if (ok) {
      this.isInvalidNewPassword = false
      this.isInvalidPasswordConfirm = false
      this.navigateTo('signin')
    } else {
      this.isInvalidNewPassword = true
      this.isInvalidPasswordConfirm = true
    }
  }
}
