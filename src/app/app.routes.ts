import { Routes } from '@angular/router'
import { AuthService } from './modules/global/services/auth/auth.service'

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'signin',
    loadComponent: () => import('./modules/global/pages/signin/signin.component').then(m => m.SigninComponent),
    canActivate: [AuthService]
  },
  {
    path: 'forget-password',
    loadComponent: () => import('./modules/global/pages/forget-password/forget-password.component').then(m => m.ForgetPasswordComponent),
    canActivate: [AuthService]
  },
  {
    path: 'home',
    loadComponent: () => import('./modules/global/pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./modules/global/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
]
