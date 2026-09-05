import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createRequire } from "node:module";

// Use the Sass compiler already supplied by Angular's build tooling.
const require = createRequire(import.meta.url);
const buildRequire = createRequire(require.resolve("@angular-devkit/build-angular/package.json"));
const { compile } = buildRequire("sass");

const root = fileURLToPath(new URL("../", import.meta.url));
const sharedCss = compile(join(root, "src/styles.scss")).css.replace(
  /@import[^;]+;/g,
  "",
);
const logo = readFileSync(
  join(root, "src/assets/images/novo-logo.png"),
).toString("base64");
const tokens = [
  ["Azul institucional", "--unirio-blue", "#004169"],
  ["Azul de apoio", "--unirio-navy", "#132E53"],
  ["Ciano institucional", "--unirio-cyan", "#0099CC"],
  ["Texto principal", "--on-surface", "#172B3C"],
  ["Texto complementar", "--on-surface-variant", "#586A78"],
  ["Superfície auxiliar", "--surface-soft", "#F3F5F6"],
];
const html = `<!doctype html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PRISMA — Sistema de design</title>
<style>
${sharedCss}
.ds-masthead{background:#004169;color:white;padding:26px max(24px,calc((100vw - 1120px)/2));display:flex;align-items:center;gap:28px}.ds-masthead img{width:160px;height:auto}.ds-masthead strong{border-left:1px solid #ffffff66;padding-left:28px;font-size:22px;letter-spacing:.05em}.ds-masthead span{font-size:13px;font-weight:400;display:block;letter-spacing:0;color:#d0e3ed}.ds-nav{border-bottom:1px solid var(--outline-variant);padding:0 max(24px,calc((100vw - 1120px)/2));display:flex;gap:25px;align-items:center;flex-wrap:wrap}.ds-nav a{padding:14px 0;font-size:13px}.ds-nav button{margin-left:auto;background:transparent;color:var(--primary-color);border:1px solid var(--outline);border-radius:4px;padding:7px 12px;font-size:12px}.ds-main{max-width:1168px;margin:auto;padding:40px 24px 70px}.ds-main>header{border-bottom:1px solid var(--outline-variant);padding-bottom:28px}.ds-main h1{font-size:36px;font-weight:600;margin-bottom:14px}.ds-main>header p{max-width:70ch;color:var(--on-surface-variant);font-size:15px}.ds-section{padding:32px 0;border-bottom:1px solid var(--outline-variant);display:grid;grid-template-columns:220px 1fr;gap:40px}.ds-section h2{font-size:20px;font-weight:600}.ds-section>div>p{font-size:14px;color:var(--on-surface-variant)}.ds-section h3{font-size:18px;font-weight:600}.ds-palette{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.ds-swatch{height:64px;border:1px solid var(--outline-variant);margin-bottom:10px}.ds-palette strong{font-size:13px;display:block}.ds-palette code{font-size:11px;color:var(--on-surface-variant);display:block;margin-top:3px}.ds-table{border-collapse:collapse;width:100%;font-size:14px}.ds-table th{font-size:12px;color:var(--on-surface-variant);font-weight:600;background:var(--surface-soft);text-align:left}.ds-table th,.ds-table td{border-bottom:1px solid var(--outline-variant);padding:14px 12px;vertical-align:top}.ds-type-title{font-size:34px;line-height:1.2;font-weight:600;letter-spacing:-.035em}.ds-type-section{font-size:24px;font-weight:600}.ds-type-body{font-size:16px;line-height:1.7}.ds-type-meta{font-size:12px;color:var(--on-surface-variant)}.ds-actions{display:flex;align-items:center;gap:16px;flex-wrap:wrap}.ds-form{max-width:470px;display:grid;gap:8px;margin-top:25px}.ds-form label{font-size:14px;font-weight:600}.ds-form input{min-height:46px;border:1px solid var(--outline);border-radius:4px;background:var(--surface);color:var(--on-surface);padding:12px}.ds-form small{font-size:12px;color:var(--on-surface-variant)}.ds-note{border-left:3px solid var(--primary-color);background:var(--surface-soft);padding:18px 20px;font-size:14px}.ds-list{list-style:none;padding:0;margin:0}.ds-list li{padding:17px 0;border-top:1px solid var(--outline-variant)}.ds-list strong{display:block;font-size:15px;margin-bottom:6px}.ds-list span{font-size:14px;color:var(--on-surface-variant)}.ds-spacing{display:flex;gap:18px;align-items:flex-end;flex-wrap:wrap}.ds-spacing>div{display:grid;gap:8px;font-size:12px}.ds-spacing i{display:block;background:var(--primary-color);width:28px}.ds-dialog{max-width:460px;width:calc(100vw - 40px);padding:30px;border:1px solid var(--outline-variant);border-radius:10px;background:var(--surface);color:var(--on-surface);box-shadow:var(--shadow-lg)}.ds-dialog::backdrop{background:#10243588}.ds-dialog p{font-size:14px;color:var(--on-surface-variant)}.ds-footer{font-size:12px;color:var(--on-surface-variant);margin-top:24px}
@media(max-width:700px){.ds-section{grid-template-columns:1fr;gap:16px}.ds-palette{grid-template-columns:repeat(2,1fr)}.ds-masthead{gap:18px}.ds-masthead img{width:120px}.ds-masthead strong{font-size:18px;padding-left:18px}.ds-nav{gap:15px}.ds-nav button{margin:8px 0}.ds-main h1{font-size:28px}}
</style></head>
<body>
<header class="ds-masthead"><img src="data:image/png;base64,${logo}" alt="UNIRIO"><strong>PRISMA<span>Sistema de design institucional</span></strong></header>
<nav class="ds-nav" aria-label="Seções da referência"><a href="#identidade">Identidade</a><a href="#tipografia">Tipografia</a><a href="#componentes">Componentes</a><a href="#conteudo">Conteúdo</a><button id="theme" type="button" aria-pressed="false">Alternar tema</button></nav>
<main class="ds-main">
<header><h1>Referência de interface</h1><p>Fundamentos e componentes do portal acadêmico. Esta página utiliza os tokens reais do projeto e demonstra seus estados; não contém publicações ou dados institucionais simulados.</p></header>
<section class="ds-section" id="identidade"><h2>01 / Identidade</h2><div><div class="ds-palette">${tokens.map(([name, token, hex]) => `<div><div class="ds-swatch" style="background:var(${token})"></div><strong>${name}</strong><code>${token}</code><code>Claro: ${hex}</code></div>`).join("")}</div><p style="margin-top:24px">Marca negativa sobre azul UNIRIO, proporção preservada, sem caixa ou efeitos adicionais. As cores de interface são semânticas e mudam com o tema.</p></div></section>
<section class="ds-section" id="tipografia"><h2>02 / Tipografia</h2><div><table class="ds-table"><thead><tr><th>Estilo</th><th>Aplicação</th></tr></thead><tbody><tr><td class="ds-type-title">Projetos acadêmicos</td><td>Título / 32–44 px / 600</td></tr><tr><td class="ds-type-section">Projetos publicados</td><td>Seção / 22–26 px / 600</td></tr><tr><td class="ds-type-body">Consulta pública aos projetos da universidade.</td><td>Texto / 16 px / 1,7</td></tr><tr><td class="ds-type-meta">Período · Unidade · Responsáveis</td><td>Metadados / 12–13 px</td></tr></tbody></table></div></section>
<section class="ds-section"><h2>03 / Espaçamento</h2><div><div class="ds-spacing">${[4, 8, 12, 16, 24, 32, 48, 64].map((n) => `<div><i style="height:${n}px"></i><span>${n} px</span></div>`).join("")}</div><p style="margin-top:24px">Container de 1240 px; margens responsivas de 20 a 48 px. Raios de 4 px para controles, 6 px para agrupamentos e 10 px para diálogos. Separadores e espaço organizam o conteúdo.</p></div></section>
<section class="ds-section" id="componentes"><h2>04 / Componentes</h2><div><div class="ds-actions"><button class="portal-button" type="button" id="open-dialog">Abrir exemplo de diálogo</button><button class="portal-button portal-button--secondary" type="button" id="clear">Limpar campo</button><button class="portal-button" type="button" disabled>Indisponível</button></div><div class="ds-form"><label for="example">Campo de exemplo</label><input id="example" type="text" aria-describedby="field-help" placeholder="Digite para conferir o estado de foco"><small id="field-help">Use Tab para percorrer os controles e verificar o foco visível.</small></div><p class="ds-note" style="margin-top:24px">Aviso contextual: informar a situação, sua consequência e o próximo passo. Erros de leitura não devem parecer resultados vazios.</p></div></section>
<section class="ds-section" id="conteudo"><h2>05 / Informação</h2><div><ul class="ds-list"><li><strong>Listas de publicações</strong><span>Tipo → título completo → resumo → unidade. A ação abre os detalhes do registro.</span></li><li><strong>Formulários de gestão</strong><span>Labels associados, seções por finalidade, ação de salvar junto ao conteúdo editável.</span></li><li><strong>Tabelas administrativas</strong><span>Cabeçalho explícito, separadores por linha e rolagem horizontal restrita à tabela.</span></li><li><strong>Imagens</strong><span>Materiais institucionais existentes e capas publicadas pela API. Sem substitutos fictícios.</span></li></ul></div></section>
<section class="ds-section"><h2>06 / Linguagem</h2><div><table class="ds-table"><thead><tr><th>Contexto</th><th>Texto</th></tr></thead><tbody><tr><td>Busca</td><td>Buscar no catálogo</td></tr><tr><td>Autenticação</td><td>Entrar no PRISMA</td></tr><tr><td>Gestão</td><td>Salvar conteúdo</td></tr><tr><td>Falha de consulta</td><td>Consulta temporariamente indisponível</td></tr><tr><td>Ausência de dado</td><td>Não informado</td></tr></tbody></table></div></section>
<p class="ds-footer">Gerado por scripts/build-design-system.mjs a partir de src/styles.scss. Regras de aplicação em DESIGN_SYSTEM.md.</p>
</main>
<dialog class="ds-dialog" id="sample-dialog" aria-labelledby="dialog-title"><h2 id="dialog-title">Diálogo de referência</h2><p>Este é um exemplo de componente. A interação não altera dados do portal.</p><form method="dialog"><button class="portal-button" type="submit">Fechar</button></form></dialog>
<script>
document.getElementById('theme').addEventListener('click', function(){const dark=document.documentElement.classList.toggle('my-app-dark');this.setAttribute('aria-pressed',String(dark))});
document.getElementById('open-dialog').addEventListener('click',()=>document.getElementById('sample-dialog').showModal());
document.getElementById('clear').addEventListener('click',()=>{const field=document.getElementById('example');field.value='';field.focus()});
</script>
</body></html>`;
mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(join(root, "docs/design-system.html"), html);
console.log("Generated docs/design-system.html from the shared styles.");
