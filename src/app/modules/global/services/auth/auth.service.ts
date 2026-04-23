import { inject, Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { Observable } from 'rxjs'
import { UsersService } from '../users/users.service'

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private usersService = inject(UsersService)
  private router = inject(Router)

  async isAuthenticated(): Promise<boolean> {
    let user = this.usersService.currentUser

    if (!user) {
      await this.usersService.rehydrateSession()
      user = this.usersService.currentUser
    }

    return !!user
  }

  async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree> {
    const isAuthenticated = await this.isAuthenticated()
    const path = next.url[0]?.path

    const publicRoutes = ['signin', 'forget-password']

    if (publicRoutes.includes(path) && isAuthenticated) {
      this.router.navigate([this.usersService.getDefaultRoute()])
      return false
    }

    if (publicRoutes.includes(path) && !isAuthenticated) {
      return true
    }

    if (!isAuthenticated) {
      this.router.navigate(['/signin'])
      return false
    }

    const role = this.usersService.currentUser?.user?.role

    // Somente /admin exige papel admin. Home é pública (acessível a visitantes também).
    if (path === 'admin' && role !== 'admin') {
      this.router.navigate(['/home'])
      return false
    }

    return true
  }
}
