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
    title: 'Entrar · PRISMA — UNIRIO',
    loadComponent: () => import('./modules/global/pages/signin/signin.component').then(m => m.SigninComponent),
    canActivate: [AuthService]
  },
  {
    path: 'home',
    title: 'Início · PRISMA — UNIRIO',
    loadComponent: () => import('./modules/global/pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'admin',
    title: 'Administração · PRISMA — UNIRIO',
    loadComponent: () => import('./modules/admin/pages/admin/admin.component').then(m => m.AdminComponent),
    canActivate: [AuthService],
    data: { roles: ['admin'] }
  },
  {
    path: 'catalogo',
    title: 'Catálogo de projetos · PRISMA — UNIRIO',
    loadComponent: () => import('./modules/editais/pages/editais/editais.component').then(m => m.EditaisComponent)
  },
  {
    path: 'editais',
    redirectTo: 'catalogo',
    pathMatch: 'full'
  },
  {
    path: 'my-projects',
    title: 'Meus projetos · PRISMA — UNIRIO',
    loadComponent: () =>
      import('./modules/professor/pages/professor-projects/professor-projects.component').then(
        m => m.ProfessorProjectsComponent
      ),
    canActivate: [AuthService],
    data: { roles: ['professor', 'tecnico', 'admin'] }
  },
  {
    path: 'professor/projects',
    redirectTo: 'my-projects',
    pathMatch: 'full'
  },
  {
    path: '**',
    title: 'Página não encontrada · PRISMA — UNIRIO',
    loadComponent: () => import('./modules/global/pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
]
