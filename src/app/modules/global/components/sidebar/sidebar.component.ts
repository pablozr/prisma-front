import { Component, OnInit, ViewChild, ViewEncapsulation, inject } from '@angular/core';
import { DrawerModule, Drawer } from 'primeng/drawer';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { AvatarModule } from 'primeng/avatar';
import { StyleClassModule } from 'primeng/styleclass';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { UsersService } from '../../services/users/users.service';
import { ISidebarRoute } from '../../interfaces/ISidebarRoute';
import { ISigninData } from '../../interfaces/ISignin';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [DrawerModule, ButtonModule, RippleModule, AvatarModule, StyleClassModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  encapsulation: ViewEncapsulation.None
})
export class SidebarComponent implements OnInit {
  private usersService = inject(UsersService);
  private router = inject(Router);

  userData!: ISigninData | null;
  sidebarVisible: boolean = false;
  currentUrl: string = '';

  availableRoutes!: ISidebarRoute[]

  @ViewChild('sidebarRef') sidebarRef!: Drawer;

  private readonly roleMap: Record<string, string> = {
    admin: 'Administrador',
    student: 'Estudante',
    professor: 'Docente'
  }

  ngOnInit() {
    this.usersService.user$.subscribe((data) => {
      this.userData = data;
    });

    this.currentUrl = this.router.url;
    this.router.events
      .pipe(filter(ev => ev instanceof NavigationEnd))
      .subscribe((ev) => {
        this.currentUrl = (ev as NavigationEnd).urlAfterRedirects || (ev as NavigationEnd).url;
      });

    this.availableRoutes = [
      {
        label: 'GERAL',
        codesCanAccess: [],
        rolesCanAccess: ['ALL'],
        hidden: false,
        status: true,
        routes: [
          {
            route: '/home',
            routeQuery: [],
            label: 'Início',
            class: 'pi pi-home',
            codesCanAccess: [],
            rolesCanAccess: ['student', 'professor'],
            status: true,
            routes: []
          },
          {
            route: '/admin',
            routeQuery: [],
            label: 'Painel administrativo',
            class: 'pi pi-shield',
            codesCanAccess: [],
            rolesCanAccess: ['admin'],
            status: true,
            routes: []
          }
        ]
      },
      {
        label: 'ACADÊMICO',
        codesCanAccess: [],
        rolesCanAccess: ['ALL'],
        hidden: false,
        status: true,
        routes: [
          {
            route: '/professor/projects',
            routeQuery: [],
            label: 'Gestão de projetos',
            class: 'pi pi-briefcase',
            codesCanAccess: [],
            rolesCanAccess: ['professor'],
            status: true,
            routes: []
          },
          {
            route: '/editais',
            routeQuery: [],
            label: 'Editais abertos',
            class: 'pi pi-file',
            codesCanAccess: [],
            rolesCanAccess: ['ALL'],
            status: true,
            routes: []
          },
          {
            route: '/student/emails',
            routeQuery: [],
            label: 'Meus emails',
            class: 'pi pi-envelope',
            codesCanAccess: [],
            rolesCanAccess: ['student'],
            status: true,
            routes: []
          },
        ]
      },
    ];
  }

  closeCallback(e: any): void {
    this.sidebarRef.close(e);
  }

  navigateTo(route: string) {
    this.sidebarVisible = false;
    this.router.navigate([route]);
  }

  navigateToWithQuery(route: string, target: string) {
    this.sidebarVisible = false;
    this.router.navigate([route], { queryParams: { target } });
  }

  async logout() {
    await this.usersService.logout();
  }

  canAccess(rolesCanAccess: string[]): boolean {
    if (!rolesCanAccess?.length) return false;

    if (rolesCanAccess.includes('ALL')) return true;

    const role = this.userData?.user?.role;
    return !!role && rolesCanAccess.includes(role);
  }

  canAccessRoute(routeRoles: string[]): boolean {
    if (routeRoles.includes('ALL')) return true;

    const role = this.userData?.user?.role;
    return !!role && routeRoles.includes(role);
  }

  customClose() {
    this.sidebarVisible = false;
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible;
  }

  isActive(route?: string, target?: string): boolean {
    if (!route) return false
    const [path, query = ''] = this.currentUrl.split('?')
    if (path !== route) return false
    if (!target) return true
    const params = new URLSearchParams(query)
    return params.get('target') === target
  }

  roleLabel(role: string | undefined | null): string {
    if (!role) return 'Sem cargo'
    return this.roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1)
  }
}
