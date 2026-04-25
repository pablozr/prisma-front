# SIEPA Front-end

Front-end web do **SIEPA** (Sistema de Iniciação, Extensão e Projetos Acadêmicos), plataforma institucional proposta para apoiar a **divulgação**, a **consulta** e a **gestão** de projetos acadêmicos da **UNIRIO**. Este repositório concentra a camada de interface responsável por apresentar informações ao usuário, controlar a navegação por perfil e intermediar a comunicação com o backend.

Este README foi escrito com dois objetivos complementares:

- explicar, de forma acessível, o papel das principais tecnologias adotadas no front-end;
- registrar, de forma tecnicamente honesta, o que já está implementado e o que ainda está em desenvolvimento ou previsto.

O documento deve ser lido em conjunto com `REQUISITOS.md`, que descreve o escopo funcional e institucional do sistema.

---

## 1. Contexto do sistema

O SIEPA nasce da necessidade de concentrar, em um ambiente único, informações sobre projetos acadêmicos da universidade, especialmente projetos de **extensão** e de **iniciação científica**. Em cenários institucionais, esses dados costumam ficar distribuídos em planilhas, arquivos isolados e processos administrativos pouco integrados. Como consequência, a consulta pública se torna difícil, a atualização de informações exige esforço manual e a visibilidade das oportunidades acadêmicas fica reduzida.

Dentro desse contexto, o front-end tem papel estratégico. Ele não apenas exibe telas, mas organiza a experiência de uso para diferentes perfis de usuário, como visitantes, estudantes, professores e administradores. Em outras palavras, é a camada que transforma regras de negócio e dados institucionais em uma navegação compreensível, segura e adequada ao público acadêmico.

---

## 2. Objetivo deste front-end

O front-end do SIEPA foi concebido para:

- disponibilizar um catálogo público de projetos acadêmicos;
- oferecer autenticação e navegação diferenciadas por perfil;
- permitir integração com serviços de autenticação e dados do backend;
- sustentar uma interface institucional responsiva, legível e consistente;
- servir como base evolutiva para funcionalidades acadêmicas mais amplas, como edição de projetos, auditoria administrativa e busca assistida por IA.

---

## 3. Leitura rápida do estado do projeto

Atualmente, este repositório já deixou de ser apenas um template visual. Ele contém uma base arquitetural consistente para o SIEPA, mas ainda está em fase de transição entre **protótipo funcional**, **integração parcial** e **escopo projetado**.

### Legenda de status

| Status | Significado |
|---|---|
| **Implementado** | A funcionalidade já existe no front-end e está conectada ao fluxo real da aplicação. |
| **Parcial** | Existe interface, serviço ou fluxo básico, mas a funcionalidade ainda não está completa de ponta a ponta. |
| **Preparado** | A arquitetura ou o contrato técnico já foi iniciado, mas a experiência final ainda não está operacional. |
| **Projetado** | A funcionalidade está prevista no escopo e nos requisitos, mas ainda não foi implementada neste front-end. |

### Situação atual resumida

| Eixo | Status | Observação |
|---|---|---|
| Arquitetura Angular, rotas e organização por módulos | **Implementado** | Base já estruturada com componentes standalone, lazy loading e configuração global. |
| Login local de administrador | **Implementado** | Fluxo integrado com backend por e-mail e senha. |
| Reidratação de sessão e refresh automático | **Implementado** | Sessão mantida via backend com `withCredentials` e interceptor de refresh. |
| Catálogo público de editais/projetos | **Parcial** | A interface existe, com filtros e detalhes, mas os dados ainda são mockados no front. |
| Contato entre aluno e docente | **Parcial** | O diálogo de envio existe, porém o envio ainda é simulado no serviço local. |
| Painel administrativo | **Parcial** | Existe página protegida e estrutura visual, mas os indicadores e ações ainda são demonstrativos. |
| Login institucional com Google para aluno/professor | **Preparado** | O contrato de serviço existe, mas o fluxo de credencial ainda não está concluído na interface. |
| Área de professor para gestão de seus projetos | **Projetado** | Prevista em `REQUISITOS.md`, ainda não implementada. |
| Busca assistida por inteligência artificial | **Projetado** | Prevista no levantamento de requisitos, ainda sem implementação no front. |
| Auditoria, importações e operação administrativa completa | **Projetado** | Requisito importante do sistema, ainda em evolução. |

---

## 4. Tecnologias adotadas e por que elas foram escolhidas

As tecnologias usadas neste projeto não foram escolhidas apenas por popularidade. Elas respondem a necessidades concretas do SIEPA: manutenção contínua, clareza de estrutura, interface institucional consistente e integração segura com backend.

| Tecnologia | Papel no projeto | Justificativa no contexto do SIEPA |
|---|---|---|
| **Angular 19** | Framework principal da aplicação | Favorece organização por componentes, padronização arquitetural e evolução incremental, o que é adequado para um sistema institucional com múltiplos módulos. |
| **TypeScript** | Linguagem principal do front-end | Permite modelar contratos de dados com mais clareza, reduzir erros de integração e melhorar a legibilidade para manutenção acadêmica e profissional. |
| **Angular Router** | Navegação por rotas | Organiza áreas públicas e restritas, facilita lazy loading e ajuda a estruturar a aplicação por perfis e domínios. |
| **HttpClient** | Comunicação com API | Centraliza chamadas HTTP, integra-se bem ao ecossistema Angular e facilita controle de autenticação, interceptação e tratamento de erros. |
| **Interceptors** | Tratamento transversal de autenticação | Permitem renovar sessão automaticamente e padronizar o comportamento diante de respostas `401`, algo importante para áreas autenticadas. |
| **RxJS** | Estado reativo e fluxos assíncronos | É usado para manter estado de sessão, observação de listas e sincronização de eventos na interface. |
| **PrimeNG** | Biblioteca de componentes de interface | Acelera a construção de telas institucionais com componentes maduros, reduz retrabalho visual e melhora consistência de UX. |
| **PrimeFlex** | Utilitários de layout e responsividade | Simplifica composição visual e adaptação para diferentes tamanhos de tela. |
| **PrimeIcons** | Ícones da interface | Padroniza a iconografia usada em navegação, ações e feedback visual. |
| **SCSS** | Estilização global e por componente | Facilita organização de estilos, reaproveitamento de tokens e personalização visual da identidade institucional. |
| **@primeng/themes** | Tema customizado do sistema | Permite definir uma linguagem visual própria para o SIEPA, com coerência entre cores, superfícies, contrastes e modo escuro. |
| **ngx-cookie-service** | Leitura e escrita de cookies de interface | Atualmente é usado em recursos auxiliares de UI, como estado de notificações. |
| **Local Storage** | Persistência de preferências locais | É usado para preservar preferências como o tema visual da aplicação. |
| **Angular CLI** | Build, execução local e estruturação | Oferece fluxo padrão de desenvolvimento, build e testes. |
| **Karma + Jasmine** | Testes unitários | Suportam validação básica de serviços e componentes já existentes no projeto. |

### Síntese técnica

Em termos práticos, o conjunto Angular + TypeScript + PrimeNG atende bem a um sistema universitário porque combina:

- organização estrutural;
- padronização visual;
- curva de manutenção mais previsível;
- facilidade para crescer por módulos sem desmontar a base existente.

---

## 5. Como a arquitetura do front-end está organizada

O projeto segue uma arquitetura orientada a componentes e domínios. Em vez de concentrar tudo em um único módulo grande, a aplicação foi dividida em áreas com responsabilidade mais clara.

### Estrutura principal

```text
src/
├── app/
│   ├── app.component.ts
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── modules/
│       ├── global/
│       ├── editais/
│       └── admin/
├── styles.scss
├── styles.ts
└── main.ts
```

### Papéis dos principais arquivos e pastas

| Caminho | Responsabilidade |
|---|---|
| `src/app/app.config.ts` | Configuração global da aplicação, incluindo roteamento, cliente HTTP, animações, idioma `pt-BR`, tema PrimeNG e inicialização da sessão. |
| `src/app/app.routes.ts` | Define as rotas públicas e protegidas do sistema. |
| `src/app/modules/global/` | Serviços e componentes compartilhados, como autenticação, usuário, cabeçalho, sidebar, breadcrumbs, tema e páginas globais. |
| `src/app/modules/editais/` | Módulo de catálogo público de editais/projetos, com filtros, cards, detalhes e contato. |
| `src/app/modules/admin/` | Área administrativa protegida por papel de acesso. |
| `src/styles.ts` | Define o preset visual institucional aplicado ao PrimeNG. |
| `src/styles.scss` | Centraliza tokens visuais, variáveis globais, regras de tema e ajustes de componentes. |

### Decisões arquiteturais relevantes

- O projeto usa **componentes standalone**, reduzindo acoplamento e simplificando importações.
- As rotas carregam componentes com **lazy loading**, melhorando organização e escalabilidade.
- A inicialização da aplicação já tenta **reidratar a sessão** antes do uso normal.
- O estado principal de autenticação é mantido por `BehaviorSubject`, permitindo reação da interface a login, logout e recuperação de sessão.

---

## 6. Tecnologias em uso dentro do código do projeto

Esta seção relaciona a tecnologia à forma concreta como ela aparece neste repositório.

### Angular 19

O Angular organiza a aplicação em componentes, serviços e rotas. No SIEPA, isso aparece de forma clara em arquivos como:

- `src/app/app.config.ts`
- `src/app/app.routes.ts`
- `src/app/modules/global/pages/signin/signin.component.ts`
- `src/app/modules/editais/pages/editais/editais.component.ts`

Na prática, ele sustenta a separação entre áreas públicas e protegidas, o carregamento sob demanda das páginas e a composição da interface por partes reutilizáveis.

### TypeScript

O TypeScript é particularmente importante neste projeto porque o sistema depende de contratos bem definidos entre front-end e backend. Interfaces como `IUser`, `IAuth`, `ISignin` e `IProject` tornam o código mais explícito e reduzem ambiguidades sobre o formato dos dados.

Exemplos:

- `src/app/modules/global/interfaces/IUser.ts`
- `src/app/modules/global/interfaces/IAuth.ts`
- `src/app/modules/editais/interfaces/IProject.ts`

### Angular Router

O roteamento separa páginas públicas, páginas autenticadas e páginas restritas por papel. Isso é essencial para um sistema com visitantes, estudantes, professores e administradores.

No estado atual:

- `/home` é público;
- `/editais` é público;
- `/signin` e `/forget-password` são públicos, mas redirecionam usuários já autenticados;
- `/admin` é protegido e exige papel `admin`.

### HttpClient e interceptors

O `HttpClient` é a base da comunicação com o backend. O projeto usa chamadas com `withCredentials: true`, o que indica que a autenticação depende de cookies gerenciados pelo navegador e emitidos pela API.

O interceptor `auth-refresh.interceptor.ts` trata respostas `401` em chamadas autenticadas e tenta renovar a sessão automaticamente. Isso melhora a experiência do usuário e reduz quebras abruptas de fluxo.

### RxJS

O RxJS aparece principalmente em `BehaviorSubject` e `Observable`. Ele sustenta:

- o estado do usuário autenticado;
- o estado de inicialização da sessão;
- a lista de projetos do catálogo;
- o controle de visibilidade de alguns elementos de interface.

O uso de reatividade aqui é importante porque o cabeçalho, a sidebar e as páginas precisam reagir ao mesmo estado de autenticação.

### PrimeNG, PrimeFlex e PrimeIcons

Essas bibliotecas sustentam grande parte da interface. O PrimeNG fornece componentes como campos, botões, diálogos, drawer lateral e mensagens. O PrimeFlex auxilia no layout. O PrimeIcons padroniza os ícones.

Essa escolha reduz custo de implementação visual e ajuda a manter uniformidade em telas institucionais.

### SCSS e tema institucional

O projeto não utiliza apenas o tema padrão da biblioteca. Há um preset institucional em `src/styles.ts` e um conjunto de variáveis semânticas em `src/styles.scss`.

Isso é relevante porque o SIEPA precisa de identidade visual própria, incluindo:

- paleta institucional;
- superfícies claras e escuras;
- tokens reutilizáveis;
- contraste adequado;
- consistência entre componentes.

### Cookies e persistência local

Há dois usos distintos de persistência:

- **cookies de sessão**, controlados pelo backend e enviados com `withCredentials`, para autenticação;
- **persistência local**, usada no front para preferências e estados auxiliares, como tema visual e notificações.

Essa distinção é importante: o front não está armazenando credenciais diretamente em `localStorage`.

---

## 7. Como o front-end consome o backend

Atualmente, a integração principal está concentrada na autenticação e nos recursos de usuário. O arquivo `src/app/modules/global/constants/apiConfig.ts` define a base local de desenvolvimento:

```text
http://localhost:8000/api/v1/unirio
```

### Endpoints já previstos na camada de serviços

| Recurso | Rota esperada | Situação no front |
|---|---|---|
| Login administrativo | `/auth/login` | **Implementado** |
| Login institucional Google | `/auth/google/login` | **Preparado** |
| Obter usuário autenticado | `/auth/me` | **Implementado** |
| Logout | `/auth/logout` | **Implementado** |
| Refresh de sessão | `/auth/refresh` | **Implementado** |
| Esqueci minha senha | `/auth/forget-password` | **Implementado** |
| Validar código de recuperação | `/auth/validate-code` | **Implementado** |
| Atualizar senha | `/auth/update-password` | **Implementado** |
| CRUD de usuários | `/users` e `/users/:id` | **Parcial** |

### O que já funciona de forma integrada

- autenticação local do administrador;
- recuperação de sessão no carregamento inicial da aplicação;
- renovação automática de sessão quando uma requisição autenticada expira;
- bloqueio de rota administrativa para usuários sem o papel adequado;
- logout com limpeza de sessão no front.

### O que ainda não está integrado ao backend

| Área | Situação atual |
|---|---|
| Catálogo de projetos/editais | Usa dados mockados em `ProjectsService`. |
| Detalhes de projeto | Renderizados com base em dados mockados locais. |
| Envio de interesse por e-mail | Simulado com `Observable` e atraso artificial. |
| Métricas administrativas | Estáticas, apenas para representação visual. |
| Busca assistida por IA | Ainda não implementada. |

### Leitura técnica do fluxo de sessão

O fluxo atual de autenticação é um dos pontos mais maduros do projeto:

1. A aplicação inicia e executa `rehydrateSession()` em `app.config.ts`.
2. O `UsersService` tenta consultar `/auth/me`.
3. Se a sessão não puder ser validada de imediato, o serviço tenta `/auth/refresh`.
4. Se o refresh funcionar, o front consulta novamente `/auth/me`.
5. Em chamadas futuras, o interceptor detecta `401` e tenta renovar a sessão automaticamente.
6. Se a renovação falhar, o usuário é redirecionado para `/signin`.

Esse desenho é coerente com a necessidade de proteger áreas restritas sem exigir novo login a cada expiração curta de sessão.

---

## 8. Funcionalidades por perfil de usuário

O `REQUISITOS.md` define quatro perfis centrais: visitante, aluno, professor e administrador. O front-end atual já representa parte desses fluxos, mas em níveis diferentes de maturidade.

| Perfil | Necessidade no sistema | Situação no front-end |
|---|---|---|
| **Visitante** | Consultar catálogo público de projetos | **Parcial**: catálogo visual existe em `/editais`, porém ainda com dados mockados. |
| **Aluno** | Descobrir oportunidades e manifestar interesse | **Parcial**: há interface de catálogo e diálogo de contato, mas sem integração real de ponta a ponta. |
| **Professor** | Autenticar-se institucionalmente e gerenciar seus projetos | **Projetado**: ainda não há módulo completo de gestão docente. |
| **Administrador** | Autenticar-se, manter dados e operar o sistema | **Parcial**: login e proteção da área já existem, mas o painel administrativo ainda está em estágio demonstrativo. |

---

## 9. Relação entre requisitos e implementação do front-end

Como o projeto tem caráter acadêmico, é importante relacionar a implementação ao levantamento de requisitos. A tabela abaixo não substitui uma matriz completa de rastreabilidade, mas oferece um panorama claro do alinhamento atual.

| Requisito | Descrição resumida | Situação no front |
|---|---|---|
| **RF-01** | Consulta pública ao catálogo | **Parcial** |
| **RF-03** | Filtros por modalidade, área, curso e unidade | **Parcial** |
| **RF-04** | Página ou visão de detalhes do projeto | **Parcial** |
| **RF-06** | Login institucional Google para aluno/professor | **Preparado** |
| **RF-08** | Login local para administrador | **Implementado** |
| **RF-09** | Manutenção de sessão autenticada | **Implementado** |
| **RF-10** | Recuperação de senha | **Implementado** |
| **RF-11** | Exibição de informações básicas do perfil | **Implementado** |
| **RF-13** | Solicitação de contato com docente | **Parcial** |
| **RF-15** | Busca assistida por IA | **Projetado** |
| **RF-16** | Professor visualizar seus projetos | **Projetado** |
| **RF-17** | Professor atualizar projeto | **Projetado** |
| **RF-20** | Importação administrativa de dados | **Projetado** |
| **RF-21** | Histórico de importações | **Projetado** |
| **RF-24** | Registro administrativo para auditoria | **Projetado** |
| **RF-25** | Acompanhamento do estado das solicitações de contato | **Projetado** |
| **RF-27** | Monitoramento mínimo da aplicação | **Projetado** |

### Interpretação dessa matriz

O front-end já avança bem sobre requisitos de:

- autenticação administrativa;
- sessão autenticada;
- recuperação de senha;
- estrutura pública de navegação;
- identidade visual institucional.

Por outro lado, os requisitos mais ligados ao **ciclo acadêmico completo**, à **operação administrativa real** e à **busca assistida por IA** ainda estão em fase de projeto ou preparação técnica.

---

## 10. Organização visual e experiência de uso

O projeto procura atender requisitos não funcionais de clareza, responsividade e coerência visual. Isso aparece em diferentes decisões:

- uso de idioma `pt-BR` na configuração global;
- interface com linguagem mais institucional e acessível;
- suporte a modo claro/escuro;
- cabeçalho, sidebar e breadcrumbs como componentes reutilizáveis;
- uso de tokens semânticos de cor, espaçamento e contraste;
- preocupação com perfis diferentes de usuário no fluxo de navegação.

Do ponto de vista acadêmico, isso é importante porque usabilidade não é apenas estética. Em um sistema universitário, usabilidade significa permitir que usuários com diferentes níveis de familiaridade técnica consigam localizar informações e entender o que fazer em cada etapa.

---

## 11. Execução local

### Requisitos

- Node.js em versão LTS
- npm
- backend disponível localmente, preferencialmente em `http://localhost:8000`

### Instalação

```bash
npm install
```

### Ambiente de desenvolvimento

```bash
npm start
```

Por padrão, a aplicação é servida pelo Angular CLI, geralmente em `http://localhost:4200`.

### Outros comandos úteis

| Comando | Finalidade |
|---|---|
| `npm run build` | Gera build de produção |
| `npm run watch` | Gera build em modo observação |
| `npm test` | Executa testes unitários com Karma/Jasmine |

### Observação prática

Mesmo sem o backend totalmente operacional, parte da interface pode ser visualizada localmente, pois o módulo de `editais` ainda usa dados simulados no próprio front. Já os fluxos de autenticação e recuperação de senha dependem da API para funcionar corretamente.

---

## 12. Pontos fortes da base atual

O estágio atual do projeto já oferece uma base relevante para evolução acadêmica e técnica:

- arquitetura organizada e coerente com crescimento modular;
- autenticação administrativa integrada;
- controle de sessão com refresh automático;
- separação entre áreas públicas e restritas;
- identidade visual institucional consistente;
- catálogo público com estrutura de filtros e detalhamento já modelada;
- tipagem explícita para entidades centrais do sistema.

Esses elementos reduzem o custo de expansão futura e tornam o projeto mais sustentável para continuidade de desenvolvimento.

---

## 13. Limitações atuais

Para que a documentação seja fiel ao estado real do projeto, é importante registrar suas limitações neste momento.

- O catálogo de projetos ainda não consome dados reais do backend.
- O envio de interesse para docentes ainda é simulado no front-end.
- O login institucional via Google ainda não está completo de ponta a ponta na interface.
- O painel administrativo ainda funciona mais como protótipo visual do que como módulo operacional completo.
- Ainda não existe módulo consolidado para gestão de projetos por professores.
- A busca assistida por IA, prevista no escopo, ainda não foi implementada.
- Ainda não há rastreabilidade completa entre todos os requisitos do documento e telas finalizadas.

Registrar essas limitações é importante não como fragilidade do projeto, mas como evidência de maturidade documental e compromisso com a realidade da implementação.

---

## 14. Evoluções previstas a partir de `REQUISITOS.md`

Com base no levantamento de requisitos do sistema, as próximas etapas naturais de evolução do front-end incluem:

- integrar o catálogo público de projetos ao backend real;
- concluir o fluxo de autenticação institucional para aluno e professor;
- distinguir automaticamente aluno e professor conforme dados institucionais;
- criar área autenticada para docentes com visualização e edição de seus projetos;
- implementar acompanhamento das solicitações de contato;
- criar telas administrativas para importação de dados, histórico de importações e auditoria;
- adicionar recursos de manutenção de cursos, unidades e estruturas institucionais;
- incorporar busca assistida por IA com limites de uso e validação coerentes com o domínio acadêmico;
- ampliar mecanismos de monitoramento e observabilidade da aplicação.

Essas evoluções estão alinhadas com a proposta original do SIEPA: não apenas exibir informações, mas estruturar uma plataforma institucional confiável para consulta, gestão e acompanhamento de projetos acadêmicos.

---

## 15. Considerações finais

O front-end do SIEPA já apresenta uma base tecnicamente consistente para um sistema institucional em evolução. Seu principal mérito, neste momento, está em combinar uma arquitetura moderna com uma proposta de interface coerente com o contexto universitário. Angular, TypeScript, PrimeNG, RxJS e SCSS não aparecem aqui como tecnologias isoladas, mas como partes de uma solução voltada à manutenção, à clareza estrutural e à futura integração com regras acadêmicas mais amplas.

Ao mesmo tempo, o projeto ainda está em construção. Por isso, este README assume uma postura deliberadamente transparente: mostra o que já funciona, o que está apenas representado e o que ainda depende de integração e desenvolvimento adicional. Para um trabalho acadêmico, essa distinção é essencial, pois demonstra domínio técnico sem confundir protótipo com produto concluído.

---

## 16. Referências internas do repositório

- `REQUISITOS.md` - levantamento de requisitos do sistema SIEPA
- `src/app/app.config.ts` - configuração global da aplicação
- `src/app/app.routes.ts` - rotas e proteção de páginas
- `src/app/modules/global/services/users/users.service.ts` - autenticação, sessão, usuário e integração principal com backend
- `src/app/modules/global/services/auth/auth-refresh.interceptor.ts` - renovação automática de sessão
- `src/app/modules/editais/services/projects/projects.service.ts` - catálogo mockado atual de projetos/editais
- `src/styles.ts` - preset visual institucional do PrimeNG
- `src/styles.scss` - tokens visuais e regras globais de tema
