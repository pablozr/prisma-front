import { TestBed } from '@angular/core/testing'
import { Router, UrlTree } from '@angular/router'
import { RouterTestingModule } from '@angular/router/testing'
import { UsersService } from '../users/users.service'
import { AuthService } from './auth.service'

describe('AuthService', () => {
  let service: AuthService
  let usersService: jasmine.SpyObj<UsersService>

  beforeEach(() => {
    usersService = jasmine.createSpyObj<UsersService>('UsersService', ['rehydrateSession', 'getDefaultRoute'], {
      currentUser: {
        user: { id: 1, institutional_email: 'aluno@unirio.br', full_name: 'Aluno', role: 'aluno', is_active: true }
      },
      isInitialized: true
    })
    usersService.rehydrateSession.and.resolveTo(true)
    usersService.getDefaultRoute.and.returnValue('/home')

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [{ provide: UsersService, useValue: usersService }]
    })
    service = TestBed.inject(AuthService)
  })

  it('should be created', () => {
    expect(service).toBeTruthy()
  })

  it('redireciona aluno da gestão de projetos para a página inicial', async () => {
    const result = await service.canActivate(
      { routeConfig: { path: 'my-projects' }, data: { roles: ['professor', 'tecnico', 'admin'] } } as any,
      {} as any
    )

    expect(result instanceof UrlTree).toBeTrue()
    expect((result as UrlTree).toString()).toBe('/home')
  })

  it('permite professor na gestão de projetos', async () => {
    Object.defineProperty(usersService, 'currentUser', {
      value: {
        user: { id: 2, institutional_email: 'professor@unirio.br', full_name: 'Professor', role: 'professor', is_active: true }
      },
      configurable: true
    })

    const result = await service.canActivate(
      { routeConfig: { path: 'my-projects' }, data: { roles: ['professor', 'tecnico', 'admin'] } } as any,
      {} as any
    )

    expect(result).toBeTrue()
  })
})
