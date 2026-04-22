---
name: angular-layout-patterns
description: >-
  Guia de arquitetura, padroes e design do template Angular Layout. Use quando criar novos
  modulos, paginas, componentes, servicos ou interfaces. Use quando o usuario pedir para
  adicionar features, criar areas como admin, dashboard, ou qualquer novo dominio. Use
  tambem ao estilizar componentes, criar layouts, tabelas, cards ou qualquer elemento visual.
---

# Angular Layout - Padroes de Desenvolvimento

## Arquitetura Geral

App standalone (sem NgModule) com lazy loading via `loadComponent`. Toda logica de dominio vive dentro de `src/app/modules/`.

```
src/app/
├── app.component.ts        # Root: toast, notification-dialog, router-outlet, button-support
├── app.config.ts            # Providers: router, http, animations, PrimeNG (preset Institutional Portal)
├── app.routes.ts            # Rotas raiz com loadComponent + canActivate
└── modules/
    ├── global/              # Modulo compartilhado (layout, auth, tema)
    └── <novo-modulo>/       # Cada feature/dominio = 1 pasta aqui
```

## Estrutura de um Modulo

Cada modulo segue **exatamente** esta hierarquia:

```
modules/<nome-modulo>/
├── pages/
│   └── <nome-page>/         # Apenas 1 page por modulo
│       ├── <nome>.component.ts
│       ├── <nome>.component.html
│       ├── <nome>.component.scss
│       └── <nome>.component.spec.ts
├── components/
│   └── <nome-componente>/    # Componentes reutilizaveis do modulo
│       ├── <nome>.component.ts
│       ├── <nome>.component.html
│       ├── <nome>.component.scss
│       └── <nome>.component.spec.ts
├── services/
│   └── <nome-service>/
│       ├── <nome>.service.ts
│       └── <nome>.service.spec.ts
└── interfaces/
    └── I<NomeInterface>.ts   # Prefixo I + PascalCase
```

## Regra: 1 Page por Modulo

Cada modulo tem **somente 1 page**. Essa page e o orquestrador:

- Se o modulo tem ramificacoes/sub-telas, a page controla qual componente exibir usando **query params**
- Navegacao interna: `router.navigate(['/rota'], { queryParams: { target: 'sub-tela' } })`
- A page le `ActivatedRoute.queryParams` e renderiza o componente correto via `@if` / `@switch`

```typescript
// Exemplo: page orquestrando sub-telas via query param
@Component({ ... })
export class AdminPageComponent {
  private route = inject(ActivatedRoute)
  currentTarget = ''

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.currentTarget = params['target'] || 'dashboard'
    })
  }
}
```

```html
<!-- Template da page -->
@switch (currentTarget) {
  @case ('dashboard') { <app-admin-dashboard /> }
  @case ('users') { <app-admin-users /> }
  @default { <app-admin-dashboard /> }
}
```

## Componentes

- **Sempre standalone**: `standalone: true` com imports explícitos
- PrimeNG modules importados diretamente no componente que usa
- DI via `inject()` (preferido) ou constructor
- Selector: `app-<nome>`
- Nomes em kebab-case nas pastas, PascalCase nas classes

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './example.component.html',
  styleUrl: './example.component.scss'
})
export class ExampleComponent {
  private myService = inject(MyService)
}
```

## Servicos

- `providedIn: 'root'` (singleton global)
- HTTP via `HttpClient` com `withCredentials: true`
- Retorno de chamadas HTTP como `Promise<T>` (padrao do projeto)
- Feedback ao usuario via `MessageService` do PrimeNG (`p-toast`)
- Estado reativo via `BehaviorSubject` + observable publico (`user$`)

## Interfaces

- Prefixo `I` + PascalCase: `IUser`, `ISigninRequest`, `ISidebarRoute`
- 1 arquivo por grupo semantico (pode ter multiplas interfaces relacionadas)
- Interfaces auxiliares internas podem ficar no mesmo arquivo sem export

## Rotas

Registrar no `app.routes.ts` com lazy loading:

```typescript
{
  path: '<nome-modulo>',
  loadComponent: () => import('./modules/<nome>/pages/<page>/<page>.component')
    .then(m => m.<Page>Component),
  canActivate: [AuthService]
}
```

## Sidebar

Ao criar um modulo novo, adicionar a rota na sidebar (`sidebar.component.ts` > `availableRoutes`):

```typescript
{
  label: 'NOME MODULO',
  codesCanAccess: [],
  rolesCanAccess: ['ALL'],  // ou roles especificas
  hidden: false,
  status: true,
  routes: [
    {
      route: '/nome-modulo',
      routeQuery: [],         // ou ['rota', 'target'] para query params
      label: 'PAGINA',
      class: 'pi pi-<icone> mr-2',
      codesCanAccess: [],
      rolesCanAccess: ['ALL'],
      status: true,
      routes: []              // sub-rotas visuais na sidebar (grandchildren)
    }
  ]
}
```

## Tema e Estilos

- Preset PrimeNG: `InstitutionalPortal` em `src/styles.ts` (base Aura + paleta institucional azul/verde)
- Dark mode: classe `.my-app-dark` no `<html>`, toggle via `ThemeService`
- CSS vars globais em `src/styles.scss`: `--primary-color`, `--primary-strong`, `--link-color`, `--on-surface`, tokens de auth, `--header-*`
- Componentes usam `var(--primary-color)` e, para texto secundário, `var(--on-surface-variant)`
- PrimeFlex para utility classes de layout (`flex`, `gap-2`, `align-items-center`)
- Fonte: Public Sans; escalas utilitárias `.ds-headline-*`, `.ds-body-*`, `.ds-label-*`

## Auth e Guards

- `AuthService` implementa `canActivate` (guard classico)
- Sessao gerenciada por `UsersService` com `BehaviorSubject`
- Reidratacao via `rehydrateSession()` ao verificar autenticacao
- Rotas protegidas recebem `canActivate: [AuthService]`

## Checklist: Criar Novo Modulo

1. Criar pasta `modules/<nome>/` com sub-pastas `pages/`, `components/`, `services/`, `interfaces/`
2. Criar a page unica do modulo em `pages/`
3. Criar componentes especificos em `components/`
4. Criar servico(s) em `services/` com `providedIn: 'root'`
5. Criar interfaces em `interfaces/` com prefixo `I`
6. Registrar rota em `app.routes.ts` com `loadComponent` + `canActivate`
7. Adicionar entrada na sidebar em `sidebar.component.ts`
8. Se houver sub-telas, usar query params na page para orquestrar componentes

---

# Design System - Guia Visual

## Filosofia

Inspirado em produtos como **Linear**, **Vercel**, **Raycast** e bibliotecas como **Aceternity UI** e **Magic UI**. O design segue estes principios:

- **"A estrutura deve ser sentida, nao vista"** — bordas e separadores sutis, hierarquia por peso visual e spacing, nao por linhas grossas
- **"Nao compita por atencao que voce nao ganhou"** — navegacao discreta, conteudo principal em destaque, elementos secundarios recuados em opacidade/tamanho
- **Densidade com respiro** — informacao compacta mas com spacing generoso entre blocos logicos
- **Nunca parecer generico de IA** — evitar layouts grid simetricos obvios, cards todos iguais, gradientes arco-iris. Preferir assimetria intencional, hierarquia clara, toques unicos

## Paleta e Variaveis

Sempre usar as CSS vars do projeto. Nunca hardcodar cores:

```scss
// Acento e interacao
var(--primary-color)       // violet — light: #7c3aed, dark: #8b5cf6
var(--secondary-color)     // #ffffff
var(--accent-gradient)     // linear-gradient(135deg, violet -> violet claro)

// Sombras e profundidade
var(--shadow-color)        // tom roxo sutil
var(--overlay-bg)          // overlay com backdrop-blur

// Header e superficies
var(--header-bg)           // glassmorphism
var(--scrollbar-thumb)     // adaptavel por modo
```

Para cores semanticas (sucesso, erro, alerta) usar os tokens do PrimeNG: `--p-green-*`, `--p-red-*`, `--p-yellow-*`.

## Tipografia

- **Fonte**: Poppins (ja carregada via Google Fonts)
- **Titulos grandes**: `font-weight: 600`, `letter-spacing: -0.02em` (tracking apertado = moderno)
- **Subtitulos/labels**: `font-weight: 300-400`, `letter-spacing: 0.04-0.06em`, `opacity: 0.65` (hierarquia visual)
- **Body text**: `font-weight: 400`, tamanho padrao
- **Numeros/KPIs**: `font-weight: 700`, tamanho grande, cor de acento
- **NUNCA** usar `text-transform: uppercase` em blocos grandes — so em labels pequenos e badges

## Espacamento

- Usar multiplos de **4px**: `4, 8, 12, 16, 24, 32, 48, 64`
- Gap entre cards/secoes: `24px` minimo
- Padding interno de cards: `20px-24px`
- PrimeFlex utilities: `gap-2`, `gap-3`, `p-3`, `p-4`, `m-3`

## Cantos Arredondados

O preset institucional define `borderRadius` global (4px botões/inputs, 8px cards). Seguir:
- Cards e containers: `0.5rem` (8px)
- Botoes e inputs: `0.25rem` (4px)
- Badges e chips: `full` (pill)
- Modais/dialogs: `14-16px`
- Avatares: `circle`

## Sombras

Sempre com tom roxo sutil (nunca sombra preta pura):

```scss
// Sombra leve (cards, inputs em hover)
box-shadow: 0 1px 8px var(--shadow-color);

// Sombra media (dropdowns, popovers)
box-shadow: 0 4px 16px var(--shadow-color);

// Sombra elevada (modais, drawers)
box-shadow: 0 8px 32px var(--shadow-color);
```

## Efeitos e Animacoes

### Regra geral
- Duracoes: `150ms` para hover, `200-300ms` para transicoes de estado, `400-600ms` para entradas
- Easing: `ease` ou `cubic-bezier(0.4, 0, 0.2, 1)` para movimentos naturais
- **Sempre** respeitar `prefers-reduced-motion` com fallback sem animacao

### Hover em elementos interativos
Todo elemento clicavel deve ter feedback visual:

```scss
.interactive-element {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 16px var(--shadow-color);
  }

  &:active {
    transform: translateY(0);
  }
}
```

### Glassmorphism (header, popovers, overlays)

```scss
.glass-surface {
  background: var(--header-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.1);
}
```

### Gradient text (titulos de destaque)

```scss
.gradient-heading {
  background: var(--accent-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Glow sutil (botoes primarios, CTAs)

```scss
.glow-button {
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    background: var(--accent-gradient);
    z-index: -1;
    opacity: 0;
    filter: blur(12px);
    transition: opacity 0.3s ease;
  }

  &:hover::after {
    opacity: 0.4;
  }
}
```

### Entrada de componentes (fade + slide)

```scss
@keyframes fadeSlideUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-in {
  animation: fadeSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) both;
}
```

### Skeleton loading (ao carregar dados)
Usar `p-skeleton` do PrimeNG com mesmas dimensoes do conteudo final para evitar layout shift.

## Componentes PrimeNG — Como Customizar

**Sempre preferir design tokens via `definePreset`** ao inves de CSS overrides diretos. Para ajustes que o preset nao cobre:

1. Usar `::ng-deep` com `:host` (scoped ao componente)
2. Ou `@layer primeng { }` no `styles.scss` para overrides globais
3. **Nunca** usar `!important` a menos que nao haja alternativa

### Cards (`p-card`)
```scss
:host ::ng-deep .p-card {
  border: 1px solid rgba(139, 92, 246, 0.08);
  box-shadow: 0 1px 8px var(--shadow-color);
  transition: box-shadow 0.2s ease, transform 0.2s ease;

  &:hover {
    box-shadow: 0 4px 16px var(--shadow-color);
    transform: translateY(-2px);
  }
}
```

### Tabelas (`p-table`)
- Header com background sutil (nao cinza pesado — usar `rgba(139,92,246,0.04)`)
- Linhas alternadas com variacao minima de fundo
- Hover na linha com tint violet: `rgba(139,92,246,0.06)`
- Bordas de 1px com opacidade baixa
- Nunca zebra-stripes agressivas

### Botoes
- **Primario**: `var(--accent-gradient)` com hover glow
- **Secundario/outlined**: borda `var(--primary-color)`, fundo transparente, hover com tint
- **Ghost/text**: sem borda, hover com background sutil
- Todos com `border-radius: 8-10px` e transicao de hover

### Inputs
- Focus com `border-color: var(--primary-color)` + `box-shadow: 0 0 0 3px rgba(139,92,246,0.15)`
- Placeholder com `opacity: 0.5`
- Labels em `font-weight: 500`, tamanho menor

### Dialogs/Modais
- Overlay com backdrop-blur (ja configurado em `--overlay-bg`)
- Conteudo com `border-radius: 14px`
- Header com gradiente sutil ou gradient text no titulo

## Layout de Paginas

### Estrutura padrao de uma page com conteudo

```html
<div class="page-container">
  <div class="page-header">
    <h1 class="gradient-heading">Titulo</h1>
    <p class="page-subtitle">Descricao curta</p>
  </div>
  <div class="page-content">
    <!-- componentes aqui -->
  </div>
</div>
```

```scss
.page-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-subtitle {
  opacity: 0.6;
  font-weight: 300;
  letter-spacing: 0.04em;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
```

### Grids de cards
Usar `display: grid` com `auto-fill` para responsividade natural:

```scss
.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
```

### Dashboards
- KPIs no topo em row com 3-4 cards compactos
- Graficos abaixo em grid 2 colunas (1 coluna em mobile)
- Tabela de dados por ultimo, full width
- Hierarquia visual: KPIs > graficos > tabela

## O que NUNCA fazer

- Backgrounds com gradientes multicolores/arco-iris
- Sombras pretas pesadas (`box-shadow: 0 4px 20px rgba(0,0,0,0.3)`)
- Bordas de 2px+ em cards e containers
- Cores de fundo solidas vibrantes em areas grandes (usar tints sutis)
- Layouts perfeitamente simetricos sem hierarquia (4 cards identicos em grid = generico)
- Textos longos centralizados
- Icones gigantes decorativos sem funcao
- Animacoes que bloqueiam interacao ou duram mais que 600ms
- Overrides PrimeNG com `!important` em cascata (usar tokens/layers)
