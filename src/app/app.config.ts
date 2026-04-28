import { ApplicationConfig, provideZoneChangeDetection, LOCALE_ID, inject, provideAppInitializer } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { MessageService } from 'primeng/api';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { InstitutionalPortal } from '../styles';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { UsersService } from './modules/global/services/users/users.service';
import { authRefreshInterceptor } from './modules/global/services/auth/auth-refresh.interceptor';

registerLocaleData(localePt, 'pt-BR');

const ptBR = {
    dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
    dayNamesShort: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
    dayNamesMin: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
    monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
    monthNamesShort: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    today: 'Hoje',
    clear: 'Limpar',
    dateFormat: 'dd/mm/yy',
    weekHeader: 'Sem'
};

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideHttpClient(withInterceptors([authRefreshInterceptor])), MessageService,
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideAnimationsAsync(),
    provideAppInitializer(() => {
      const users = inject(UsersService)
      return users.rehydrateSession().catch(() => false)
    }),
    providePrimeNG({
        translation: ptBR,
        theme: {
          preset: InstitutionalPortal,
          options: {
            darkModeSelector: '.my-app-dark'
          }
        }
    })]
};
