# PRISMA — sistema de design institucional

## Referência visual executável

A referência de componentes está em [docs/design-system.html](docs/design-system.html). Para regenerá-la a partir dos estilos reais, execute:

```sh
node scripts/build-design-system.mjs
```

O gerador incorpora os tokens e componentes globais de `src/styles.scss`. A documentação visual não é uma rota pública nem contém projetos demonstrativos.

## Direção editorial

O PRISMA é um portal de consulta e gestão de projetos acadêmicos. Sua interface apresenta informação institucional de forma direta: identificação da universidade, navegação, busca, resultados, responsáveis e período.

A home usa a imagem institucional existente, publicações em lista e um índice de acesso. Os textos descrevem funções existentes. Sem slogans, ilustrações de produto, estatísticas decorativas ou cards de acesso. O login usa a imagem original da UNIRIO e um formulário separado.

## Identidade

Fonte cromática: [Guia rápido da identidade visual da UNIRIO, página 3](https://www.unirio.br/comunicacaosocial/arquivos/arquivos-iv-unirio/copy_of_guiarpidodeaplicaodaidentidadevisualunirio_v1.pdf).

A organização da navegação considera a referência de [navegação de serviços do GOV.UK](https://design-system.service.gov.uk/patterns/navigate-a-service/), preservando a identidade da universidade.

| Token / papel            | Claro   | Uso                                 |
| ------------------------ | ------- | ----------------------------------- |
| `--unirio-blue`          | #004169 | Masthead e marca                    |
| `--unirio-navy`          | #132E53 | Apoio institucional                 |
| `--unirio-cyan`          | #0099CC | Acentos gráficos, não texto pequeno |
| `--primary-color`        | #004169 | Links, botões e seleção             |
| `--on-surface`           | #172B3C | Texto principal                     |
| `--on-surface-variant`   | #586A78 | Texto complementar                  |
| `--canvas` / `--surface` | #FFFFFF | Área de leitura e formulários       |
| `--surface-soft`         | #F3F5F6 | Agrupamentos e avisos               |
| `--outline-variant`      | #DDE5EB | Separadores                         |
| `--outline`              | #758795 | Controles e foco auxiliar           |

O tema escuro redefine os tokens semânticos, mantendo o masthead institucional. A preferência salva do usuário é preservada; o claro é o padrão inicial.

### Arquivos de imagem

- `src/assets/images/novo-logo.png`: assinatura negativa já presente no projeto. Usar sobre o azul institucional, sem caixa adicional, filtros ou alteração de proporção. No desktop, 160 px de largura.
- `src/assets/images/maxresdefault.jpg`: composição institucional já presente no projeto, usada na home e no login.
- Não usar imagens geradas para representar a universidade ou capas fictícias de projetos.
- Capas do catálogo vêm exclusivamente da API. Sem capa, cards e detalhes exibem um placeholder neutro com ícone de imagem e o texto “Sem imagem de capa”.

## Estrutura e composição

| Elemento            | Regra                                                         |
| ------------------- | ------------------------------------------------------------- |
| Container           | 1240 px incluindo margens internas                            |
| Margens             | 20–48 px responsivos                                          |
| Grade principal     | Área de informação + índice lateral na home                   |
| Espaçamento         | Escala de 4, 8, 12, 16, 24, 32, 48, 64 px                     |
| Raio de controle    | 4 px                                                          |
| Raio de agrupamento | 6 px                                                          |
| Raio de diálogo     | 10 px                                                         |
| Sombra              | Apenas overlays; conteúdo usa separadores e espaço            |
| Navegação           | Links expostos, seleção por sublinhado de 3 px                |
| Superfícies         | Sem gradientes decorativos ou efeito de vidro                 |
| Imagem              | Fotografia/composição existente, proporção preservada na home |

### Tipografia

Fontes nativas: `-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`. A assinatura PRISMA usa Calibri/Segoe UI como identificação institucional. Não há dependência de Google Fonts.

- Texto base: 16 px / 1,6.
- Título de página: 32–44 px / 1,25, peso 600.
- Título de seção: 22–26 px, peso 600.
- Título de publicação: 17–19 px, sem truncamento.
- Conteúdo e formulários: 14–16 px / 1,7–1,8.
- Metadados: 12–13 px.
- Microtexto: reservado à identificação e legendas auxiliares, nunca à informação principal.
- Caixa alta apenas em rótulos curtos; títulos usam escrita normal.

## Implementação reutilizável

- `src/styles.scss`: tokens claros/escuros, botões, foco, estados e componentes globais.
- `src/styles.ts`: preset PrimeNG com cores, raios e controles correspondentes.
- `src/app/modules/global/styles/_page.scss`: mixins `layout`, `heading`, `title`, `eyebrow` e `lead`, usados no catálogo, administração e gestão.
- Cabeçalho, breadcrumbs, ajuda, botão de tema e rodapé compartilhados.
- Cada componente tem estilos de composição próprios; as cores e os raios vêm dos tokens.

## Padrões de interação

### Consulta pública

A home envia `q` para o catálogo. Um projeto da lista encaminha seu identificador em `projeto` para abrir os detalhes correspondentes. A API fornece títulos, descrições, datas e total. Nenhuma dessas informações é produzida pelo layout.

Filtros combinam busca, área, centro, curso e unidade. Chips representam apenas filtros ativos. Ordenação é explicitamente selecionada. Alterar busca ou filtros reinicia a paginação.

### Informação de projeto

Hierarquia: tipo, título, unidade, resumo, áreas, período e ação. Resumo pode ser abreviado na listagem; detalhes mostram o texto integral. O resumo institucional fica aberto por padrão. Oportunidades e contatos aparecem somente quando informados.

### Gestão e administração

As rotas e permissões existentes são preservadas. Tabelas têm cabeçalhos, separadores e rolagem horizontal local. Formulários possuem labels associados. Salvar conteúdo, salvar capa e criar oportunidade são ações distintas junto à sua seção.

### Autenticação

Comunidade acadêmica: Google institucional. Administrador: e-mail e senha. Abas com navegação por teclado e indicador linear. Senha com controle de visibilidade. Link de retorno ao portal e acesso ao catálogo sem login. A imagem original ocupa o painel institucional.

### Estados e feedback

- Carregamento: skeleton ou texto com `role=status`.
- Vazio: informar ausência de resultados e oferecer ajuste de filtros.
- Indisponibilidade: aviso contextual e “Tentar novamente”, preservando filtros.
- Contagem desconhecida: “—”, nunca zero fictício.
- Erros de leitura já explicados no conteúdo não geram um toast duplicado.
- Mensagens de ações usam o serviço global de feedback.
- 404: orientação objetiva e links para início/catálogo.

## Acessibilidade e tamanhos

Foco visível, link para pular ao conteúdo, `aria-current` na navegação, labels nos formulários, nomes acessíveis nos botões de ícone, indicadores acompanhados por texto e redução de movimento. Diálogos bloqueiam rolagem do fundo e fecham por Escape.

Desktop: grade em colunas, cabeçalho completo, tabelas locais. Tablet: margens menores e grades reduzidas. Celular: home e filtros em coluna, navegação horizontal, imagem institucional acima do formulário, sem ocultar as ações principais.

## Conteúdo

Usar texto factual em português brasileiro: “Projetos acadêmicos”, “Buscar”, “Consultar catálogo”, “Entrar”, “Salvar conteúdo”. Evitar linguagem promocional. Não publicar contatos de suporte, semestre, notícias ou eventos sem fonte.

## Acabamento da página inicial

A home usa `--surface-paper` (#F8F9F7 no claro e #142330 no escuro) para uma superfície de leitura menos branca, com títulos de peso 550, entrelinha generosa e separadores discretos. A imagem institucional e a busca usam `--radius-comfort` (12 px). O restante da informação continua em listas e colunas, sem cards de acesso. A descrição é factual e curta. Não há alteração de cores ou conteúdo da imagem institucional.

### Controles e dialogs de projetos

Os botões de ação compartilham os mixins de `src/app/modules/global/styles/_controls.scss`: altura mínima de 44 px, fundo primário sólido e foco visível. Ações secundárias usam borda `--outline`, com superfície azul no hover. Botões PrimeNG mantêm suas cores semânticas.

Os detalhes públicos separam a leitura do projeto das informações gerais e contatos, empilhando as áreas em telas menores que 760 px. A edição organiza conteúdo, capa, oportunidades e dados institucionais em seções; alternar a seção preserva o formulário. Cada seção editável mantém sua ação de salvar. O overlay usa máscara sólida, e os dialogs de projetos e ajuda usam transição de 120 ms.
