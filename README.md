# Angular Layout — Template de aplicação

Template de front-end em **Angular 19** com **componentes standalone**, **lazy loading** por rota, **PrimeNG** (tema Amethyst), **PrimeFlex**, autenticação baseada em guard e layout com sidebar, header e suporte a tema claro/escuro. Serve como ponto de partida para aplicações internas ou SaaS com convenções de pastas e UI consistentes.

---

## Requisitos

- **Node.js** (LTS recomendado)
- **npm** (ou gestor compatível)

---

## Início rápido

```bash
npm install
npm start
```

A aplicação é servida em desenvolvimento via `ng serve` (porta predefinida do Angular CLI, habitualmente `http://localhost:4200`).

Outros comandos úteis:

| Comando | Descrição |
|--------|-----------|
| `npm run build` | Build de produção (`dist/<nome-do-projeto>`) |
| `npm run watch` | Build em modo desenvolvimento com observação de ficheiros |
| `npm test` | Testes unitários (Karma / Jasmine) |
| `npm run rename-project -- <novo-slug>` | Ver secção [Renomear o projeto](#renomear-o-projeto) |

---

## Stack principal

- **Angular** 19.x (standalone, `inject()`, rotas com `loadComponent`)
- **PrimeNG** 19.x com preset **Amethyst** e tradução PT-BR em `app.config.ts`
- **PrimeFlex** e **PrimeIcons**
- **ngx-cookie-service** para cookies no browser
- **RxJS** e **Zone.js** conforme predefinição do Angular
- Estilos globais em **SCSS**; tokens e modo escuro em `src/styles.scss` e `src/styles.ts`

---

## Arquitetura

### Raiz da aplicação

- `src/app/app.component.ts` — raiz: outlet, toast, diálogo de notificações
- `src/app/app.config.ts` — `provideRouter`, `provideHttpClient`, animações, `providePrimeNG`, `LOCALE_ID` `pt-BR`
- `src/app/app.routes.ts` — rotas com `loadComponent` e `canActivate` onde aplicável

### Módulos de domínio

Toda a lógica organizacional vive em `src/app/modules/`.

- **`global/`** — layout partilhado: autenticação (`AuthService`, `UsersService`), páginas de sessão (signin, register, forget-password), home, 404, componentes de UI global (header, sidebar, loading, tema, suporte, notificações) e interfaces comuns.

Cada **novo domínio** deve ser uma pasta em `modules/<nome>/` com esta hierarquia:

- `pages/` — **uma única page por módulo** (orquestrador)
- `components/` — componentes reutilizáveis desse módulo
- `services/` — serviços com `providedIn: 'root'` quando fizer sentido
- `interfaces/` — tipos com prefixo `I` (ex.: `IUser.ts`)

Sub-áreas do mesmo módulo podem ser tratadas na page com **query params** (ex.: `target=dashboard`) e `@switch` / `@if` no template, em vez de multiplicar rotas de topo sem necessidade.

### Rotas e segurança

- Rotas registadas em `app.routes.ts` com `loadComponent: () => import(...).then(m => m.XComponent)`.
- **`AuthService`** implementa `canActivate` para controlar acesso às rotas protegidas.
- A reidratação de sessão e estado do utilizador segue o padrão do `UsersService` (ex.: `BehaviorSubject`).

### Sidebar

Novas áreas devem ser refletidas em `sidebar.component.ts` (lista `availableRoutes`), com labels, ícones PrimeIcons, roles/codes de acesso e, se necessário, `routeQuery` para alinhar com query params da page.

---

## UI, tema e estilos

- **Preset PrimeNG Amethyst** (base Aura, acento violeta); modo escuro via classe `.my-app-dark` no elemento raiz HTML, coordenado pelo `ThemeService`.
- Variáveis CSS globais (ex.: `--primary-color`, `--accent-gradient`, `--shadow-color`) em `src/styles.scss`; componentes devem preferir estas variáveis a cores fixas.
- **Poppins** como família tipográfica.
- **PrimeFlex** para utilitários de layout (`flex`, `gap-*`, alinhamentos).

O projeto segue uma linha visual moderna e contida (hierarquia por espaçamento e peso tipográfico, sombras e bordas subtis, animações curtas e respeito a `prefers-reduced-motion` onde aplicável).

---

## Convenções de código

- Componentes **standalone**: `standalone: true`, imports explícitos de módulos PrimeNG usados no ficheiro.
- Seletores: `app-<nome>`; pastas em kebab-case; classes em PascalCase.
- **HTTP**: `HttpClient`; o projeto tende a expor operações assíncronas como **Promises** nos serviços que encapsulam API.
- Feedback ao utilizador: **PrimeNG** `MessageService` / toast conforme serviços existentes (ex.: `AppToastService`).

---

## Renomear o projeto

O repositório inclui o script **`scripts/rename-project.mjs`**, que alinha o **nome do pacote npm**, a **chave do projeto no `angular.json`**, referências internas nesse ficheiro (incluindo caminhos de build), o **`package-lock.json`** (quando existe), o **`<title>`** em `src/index.html`, e tenta atualizar a propriedade **`title`** em `src/app/app.component.ts` e no spec correspondente **quando o valor atual coincide com o slug antigo** entre aspas.

### Deteção do nome atual

O slug antigo **não está fixo**. O script obtém-o de:

1. `angular.json` — chave em `projects` que corresponde a `package.json` > `name`, ou
2. o primeiro projeto com `projectType === 'application'`, ou
3. a primeira chave em `projects`.

Se `package.json` e `angular.json` estiverem dessincronizados, use **`--from=slug_correcto`** para forçar o slug de origem.

### Nome novo (package / Angular)

Deve satisfazer: letras minúsculas, números, hífen e underscore, **começando por letra** (ex.: `meu_app`, `cliente-loja`).

### Título na UI (separador do browser e app)

- Com **`--title "Texto legível"`** define-se explicitamente o título.
- Sem `--title`, o título é derivado do slug (ex.: `minha_loja` → `Minha Loja`).

### Pasta no disco

- Por defeito, a pasta do projeto no sistema de ficheiros passa a ter o **mesmo nome que o novo slug**.
- **`--folder=NomeDaPasta`** define outro nome de pasta (útil para maiúsculas ou underscores visíveis no Explorer); o nome não pode conter caracteres reservados do Windows (`\ / : * ? " < > |`, etc.).
- **`--no-rename-folder`** atualiza apenas ficheiros de configuração e código, **sem** renomear a pasta raiz.

### Simulação

- **`--dry-run`** mostra o que seria alterado **sem gravar** ficheiros nem renomear a pasta.

### Windows e renomeação da pasta

No Windows, o script tenta `fs.renameSync` com **repetições** em caso de `EPERM` / `EBUSY` (ficheiros abertos no IDE). Se falhar, usa **PowerShell** (`Rename-Item`). Alterações só de maiúsculas/minúsculas no nome da pasta usam um nome temporário intermédio. Após renomear a pasta, deve abrir-se o projeto na **nova localização** no editor.

### Exemplos

```bash
node scripts/rename-project.mjs meu_projeto
node scripts/rename-project.mjs --slug cliente-acme --title "Cliente Acme"
npm run rename-project -- minha-loja
node scripts/rename-project.mjs meu-app --dry-run
node scripts/rename-project.mjs novo_nome --folder MinhaApp_UI --no-rename-folder
```

### Após renomear

- O output de build aponta para `dist/<novo-slug>`.
- Se o CLI referir cache ou nome antigo, pode remover `.angular/cache` e voltar a executar o build.

---

## Estrutura de pastas (resumo)

```
src/app/
├── app.component.ts
├── app.config.ts
├── app.routes.ts
└── modules/
    └── global/
        ├── pages/
        ├── components/
        ├── services/
        └── interfaces/
```

---

## Privacidade e analytics

O ficheiro `angular.json` tem **`cli.analytics` desativado** por defeito.

---

## Licença e uso

O campo `private: true` em `package.json` indica que o pacote não se destina a publicação no registo npm. Ajuste a licença e a documentação legal conforme o produto final.
