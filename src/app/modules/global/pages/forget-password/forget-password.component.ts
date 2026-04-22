import { UsersService } from './../../services/users/users.service';
import { Component, OnInit, inject } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AppToastService } from '../../services/toast/app-toast.service';
import { StepsModule } from 'primeng/steps';
import { ButtonModule } from 'primeng/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingComponent } from '../../components/loading/loading.component';
import { RippleModule } from 'primeng/ripple';
import { ButtonThemeComponent } from '../../components/button-theme/button-theme.component';
import { AuthHeroCaptionComponent } from '../../components/auth-hero-caption/auth-hero-caption.component';
import { AUTH_HERO_IMAGE_PATH } from '../../constants/authHeroImagePath';

@Component({
  selector: 'app-forget-password',
  standalone: true,
  imports: [StepsModule, ButtonModule, ReactiveFormsModule, InputTextModule, CommonModule, LoadingComponent, RippleModule, ButtonThemeComponent, AuthHeroCaptionComponent],
  templateUrl: './forget-password.component.html',
  styleUrl: './forget-password.component.scss'
})
export class ForgetPasswordComponent implements OnInit {
    usersServices = inject(UsersService);

    private router = inject(Router);
    private toast = inject(AppToastService);

    readonly authHeroSrc = AUTH_HERO_IMAGE_PATH;

    isLoading: boolean = false;

    isInvalidEmail: boolean = false;

    isInvalidHash: boolean = false;

    isInvalidNewPassword: boolean = false;
    isInvalidPasswordConfirm: boolean = false;

    userForgetPasswordId: string = '';

    items: MenuItem[] | undefined;
    active: number = 0;

    forgetPasswordEmailForm!: FormGroup;
    forgetPasswordHashForm!: FormGroup;
    forgetPasswordNewPasswordForm!: FormGroup;


    ngOnInit() {
      this.items = [
        {
          label: 'Email',
        },
        {
          label: 'Código',
        },
        {
          label: 'Nova Senha',
        }
      ];

      this.forgetPasswordEmailForm = new FormGroup({
        email: new FormControl('', [Validators.required]),
      })

      this.forgetPasswordHashForm = new FormGroup({
        hash: new FormControl('', [Validators.required]),
      })

      this.forgetPasswordNewPasswordForm = new FormGroup({
        newPassword: new FormControl('', [Validators.required]),
        passwordConfirm: new FormControl('', [Validators.required])
      })
    }

    navigateTo(route: string){
      this.router.navigate([route]);
    }

    async onSubmitEmail(){
      if (this.forgetPasswordEmailForm.value.email){
        this.isLoading = true;

        const validation = await this.usersServices.sendEmailForgetPassword(this.forgetPasswordEmailForm.value);

        this.isLoading = false;

        if (typeof(validation) == 'object'){
          this.active = 1
          this.userForgetPasswordId = `${validation?.id}`;
          this.isInvalidEmail = false;
        } else{
          this.isInvalidEmail = true;
        }
      } else{
        this.toast.error('E-mail vazio', 'Preencha todos os campos antes de continuar.');
        this.isInvalidEmail = true;
      }
    }

    async onSubmitHashCode(){
      if (this.forgetPasswordHashForm.value.hash){
        this.isLoading = true;

        const validation = await this.usersServices.validateHashCode({hash: this.forgetPasswordHashForm.value.hash, userId: this.userForgetPasswordId});

        this.isLoading = false;

          if (validation){
            this.active = 2
            this.isInvalidHash = false;
          } else{
            this.isInvalidHash = true;
          }
      } else{
        this.toast.error('Codigo vazio', 'Preencha todos os campos antes de continuar.');
        this.isInvalidHash = true;
      }
    }

    async onSubmitNewPassword(){
      if (this.forgetPasswordNewPasswordForm.value.newPassword && this.forgetPasswordNewPasswordForm.value.passwordConfirm && this.userForgetPasswordId){
        this.isLoading = true;

        const validation = await this.usersServices.editPasswordWithOutOldPassword(this.userForgetPasswordId, {...this.forgetPasswordNewPasswordForm.value});

        this.isLoading = false;

        if (validation){
          this.isInvalidNewPassword = false;
          this.isInvalidPasswordConfirm = false;
          this.navigateTo('signin');
        } else{
          this.isInvalidNewPassword = true;
          this.isInvalidPasswordConfirm = true;
        }
    } else{
      this.toast.error('Dados incompletos', 'Preencha todos os campos antes de continuar.');
      this.isInvalidNewPassword = true;
      this.isInvalidPasswordConfirm = true;
      }
    }
}
