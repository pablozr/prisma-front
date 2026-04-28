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
    path: 'admin',
    loadComponent: () => import('./modules/admin/pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AuthService]
  },
  {
    path: 'editais',
    loadComponent: () => import('./modules/editais/pages/editais/editais.component').then(m => m.EditaisComponent)
  },
  {
    path: 'professor/projects',
    loadComponent: () =>
      import('./modules/professor/pages/professor-projects/professor-projects.component').then(
        m => m.ProfessorProjectsComponent
      ),
    canActivate: [AuthService]
  },
  {
    path: '**',
    loadComponent: () => import('./modules/global/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
]
