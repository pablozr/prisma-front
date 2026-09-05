# PRISMA — Frontend

Interface web do **PRISMA (Plataforma de Referência e Integração de Saberes e Mediação Acadêmica)**, sistema da UNIRIO para consulta pública e gestão de projetos acadêmicos importados do SIE.

Este README registra o estado implementado no frontend, sem misturar funcionalidades planejadas com recursos disponíveis.

## Funcionalidades atuais

- página inicial institucional;
- catálogo público integrado à API, com busca, filtros, paginação e detalhes;
- exibição de oportunidades, áreas, cursos, unidade, período e responsáveis;
- contato externo por link `mailto:` usando o e-mail institucional público do responsável;
- login institucional via Google para a comunidade acadêmica;
- login local de administrador;
- reidratação e renovação automática da sessão;
- área de professor/técnico para editar descrições, capa e oportunidades dos próprios projetos;
- área administrativa para usuários, publicação/visibilidade de projetos, métricas e sincronizações;
- tema claro/escuro e layout responsivo.

## Fora do escopo do projeto-base

- central interna de notificações;
- disparo automático de e-mails;
- recuperação de senha por e-mail;
- chat ou mensageria entre aluno e responsável;
- inscrição e seleção completa de candidatos;
- busca assistida por inteligência artificial.

O link `mailto:` apenas abre o aplicativo de e-mail escolhido pelo visitante. O PRISMA não envia nem armazena essa mensagem.

## Rotas principais

| Rota | Acesso | Finalidade |
|---|---|---|
| `/home` | Público | Apresentação do sistema |
| `/catalogo` | Público | Consulta e filtragem de projetos |
| `/signin` | Público | Autenticação institucional ou administrativa |
| `/my-projects` | Professor, técnico ou administrador | Gestão dos projetos vinculados |
| `/admin` | Administrador | Administração e acompanhamento do sistema |

`/editais` redireciona para `/catalogo`, e `/professor/projects` redireciona para `/my-projects` por compatibilidade de navegação.

## Tecnologias

- Angular 19 e TypeScript;
- componentes standalone e lazy loading;
- Angular Router e HttpClient;
- RxJS;
- PrimeNG, PrimeFlex e PrimeIcons;
- SCSS;
- Jasmine e Karma.

Os cookies de autenticação são definidos pelo backend como `HttpOnly`. O frontend apenas envia requisições com `withCredentials` e não armazena tokens em `localStorage`.

## Estrutura

```text
src/app/
├── modules/admin/       administração
├── modules/editais/     catálogo público
├── modules/global/      autenticação e componentes compartilhados
├── modules/professor/   gestão dos projetos vinculados
├── app.config.ts
└── app.routes.ts
```

## Execução local

Requisitos: Node.js e dependências instaladas.

```bash
npm install
npm start
```

A aplicação de desenvolvimento abre em `http://localhost:4200` e usa, por padrão, a API em `http://localhost:5685/api/v1/unirio`.

## Validação

```bash
npm run build
npm test -- --watch=false
```

## Regra de documentação

Recursos ainda não implementados devem ser descritos no TCC como trabalhos futuros, limitações ou possibilidades de evolução. Notificações e envio automático de e-mails não fazem parte do projeto-base atual.

## Sistema de design

As regras de identidade, tipografia, componentes e responsividade estão em [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md). A referência visual está em [docs/design-system.html](docs/design-system.html); regenere-a com `node scripts/build-design-system.mjs`. Ela usa os estilos globais reais e não insere dados demonstrativos no portal.
