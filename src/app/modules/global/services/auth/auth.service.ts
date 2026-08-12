import { inject, Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { Observable } from 'rxjs'
import { UserRole } from '../../interfaces/IUser'
import { UsersService } from '../users/users.service'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usersService = inject(UsersService)
  private router = inject(Router)

  async isAuthenticated(validateServerSession = false): Promise<boolean> {
    let user = this.usersService.currentUser

    if (validateServerSession && user) {
      await this.usersService.rehydrateSession()
      user = this.usersService.currentUser
      return !!user
    }

    if (!user && !this.usersService.isInitialized) {
      await this.usersService.rehydrateSession()
      user = this.usersService.currentUser
    }

    return !!user
  }

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree> {
    const isAuthenticated = await this.isAuthenticated(true)
    const path = next.routeConfig?.path || ''

    const publicRoutes = ['signin', 'forget-password']

    if (publicRoutes.includes(path) && isAuthenticated) {
      return this.router.createUrlTree([this.usersService.getDefaultRoute()])
    }

    if (publicRoutes.includes(path) && !isAuthenticated) {
      return true
    }

    if (!isAuthenticated) {
      return this.router.createUrlTree(['/signin'])
    }

    const role = this.usersService.currentUser?.user?.role
    const allowedRoles = next.data?.['roles'] as UserRole[] | undefined

    if (allowedRoles && (!role || !allowedRoles.includes(role))) {
      return this.router.createUrlTree(['/home'])
    }

    return true
  }
}
