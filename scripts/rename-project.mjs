#!/usr/bin/env node
/**
 * Renomeia o projeto em angular.json, package.json, lockfile e ficheiros de app.
 *
 * O nome ANTIGO é lido automaticamente de package.json + angular.json (não está fixo a "angular-layout").
 *   --from=slug-antigo     força o slug antigo se a deteção falhar
 *
 * Uso:
 *   node scripts/rename-project.mjs meu_projeto
 *   node scripts/rename-project.mjs --slug cliente-acme --title "Cliente Acme"
 *   npm run rename-project -- minha_loja
 *   node scripts/rename-project.mjs meu-app --dry-run
 *
 * Pasta no disco: por defeito igual ao novo slug.
 *   --folder=Outro_Nome   nome da pasta (pode ter _ e maiúsculas); se omitido, usa o slug
 *   --no-rename-folder    não altera a pasta
 *
 * Novo nome (package / projeto Angular): letras minúsculas, números, hífen e underscore (ex.: meu_app, minha-loja).
 * Se --title for omitido, o título na UI deriva do slug (ex.: minha_loja → Minha Loja).
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

/** npm / angular project: minúsculas, números, - e _ */
const RE_NEW_PACKAGE_SLUG = /^[a-z][a-z0-9_-]*$/

/** pasta no disco (--folder): sem caracteres reservados do Windows */
const RE_FOLDER_NAME =
  /^[^<>:"/\\|?*\u0000-\u001f]{1,240}$/

function parseArgs(argv) {
  let dryRun = false
  let slug = ''
  let title = ''
  let folderName = ''
  let fromSlug = ''
  let renameFolder = true
  const rest = []
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--dry-run') dryRun = true
    else if (a === '--no-rename-folder') renameFolder = false
    else if (a.startsWith('--slug=')) slug = a.slice(7)
    else if (a.startsWith('--title=')) title = a.slice(8)
    else if (a.startsWith('--folder=')) folderName = a.slice(9)
    else if (a.startsWith('--from=')) fromSlug = a.slice(7)
    else if (a === '--slug' && argv[i + 1]) slug = argv[++i]
    else if (a === '--title' && argv[i + 1]) title = argv[++i]
    else if (a === '--folder' && argv[i + 1]) folderName = argv[++i]
    else if (a === '--from' && argv[i + 1]) fromSlug = argv[++i]
    else if (!a.startsWith('-')) rest.push(a)
  }
  if (!slug && rest[0]) slug = rest[0]
  return {
    dryRun,
    slug: slug.trim(),
    title: title.trim(),
    folderName: folderName.trim(),
    fromSlug: fromSlug.trim(),
    renameFolder
  }
}

function detectOldSlug(explicit) {
  if (explicit) return explicit
  const angPath = path.join(ROOT, 'angular.json')
  const data = JSON.parse(fs.readFileSync(angPath, 'utf8'))
  const keys = Object.keys(data.projects || {})
  if (keys.length === 0) {
    console.error('Erro: angular.json não tem "projects".')
    process.exit(1)
  }
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'))
  const name = pkg.name
  if (name && keys.includes(name)) return name
  const appKey = keys.find((k) => data.projects[k].projectType === 'application')
  return appKey || keys[0]
}

function slugToTitle(slug) {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function assertValidNewPackageSlug(slug, oldSlug) {
  if (!slug) {
    console.error('Erro: informe o novo nome (ex.: node scripts/rename-project.mjs meu_app)')
    process.exit(1)
  }
  if (!RE_NEW_PACKAGE_SLUG.test(slug)) {
    console.error(
      'Erro: nome inválido para package.json / angular.json. Use minúsculas, números, hífen e underscore; comece com letra (ex.: meu_app, cliente-loja).'
    )
    process.exit(1)
  }
  if (slug === oldSlug) {
    console.error('Erro: o nome novo tem de ser diferente do atual (' + oldSlug + ').')
    process.exit(1)
  }
}

function assertValidFolderName(name) {
  const t = name.trim()
  if (!t || t === '.' || t === '..') {
    console.error('Erro: nome de pasta inválido.')
    process.exit(1)
  }
  if (!RE_FOLDER_NAME.test(t)) {
    console.error(
      'Erro: nome de pasta com caracteres não permitidos no Windows (ex.: \\ / : * ? " < > |).'
    )
    process.exit(1)
  }
}

function deepReplaceProjectStrings(obj, oldSlug, newSlug) {
  if (obj === null || obj === undefined) return
  if (typeof obj === 'string') {
    return obj.split(oldSlug).join(newSlug)
  }
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const v = obj[i]
      if (typeof v === 'string') obj[i] = v.split(oldSlug).join(newSlug)
      else deepReplaceProjectStrings(v, oldSlug, newSlug)
    }
    return
  }
  if (typeof obj === 'object') {
    for (const k of Object.keys(obj)) {
      const v = obj[k]
      if (typeof v === 'string') obj[k] = v.split(oldSlug).join(newSlug)
      else deepReplaceProjectStrings(v, oldSlug, newSlug)
    }
  }
}

function patchAngularJson(oldSlug, newSlug, dryRun) {
  const p = path.join(ROOT, 'angular.json')
  const raw = fs.readFileSync(p, 'utf8')
  const data = JSON.parse(raw)
  if (!data.projects?.[oldSlug]) {
    console.error(
      `Erro: em angular.json não existe o projeto "${oldSlug}". Usa --from=slug_correcto se o package.json estiver dessincronizado.`
    )
    process.exit(1)
  }
  data.projects[newSlug] = data.projects[oldSlug]
  delete data.projects[oldSlug]
  deepReplaceProjectStrings(data, oldSlug, newSlug)
  const out = JSON.stringify(data, null, 2) + '\n'
  if (dryRun) console.log('[dry-run] gravaria angular.json')
  else fs.writeFileSync(p, out, 'utf8')
}

function patchPackageJson(oldSlug, newSlug, dryRun) {
  const p = path.join(ROOT, 'package.json')
  const data = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (data.name === oldSlug) data.name = newSlug
  const out = JSON.stringify(data, null, 2) + '\n'
  if (dryRun) console.log('[dry-run] gravaria package.json')
  else fs.writeFileSync(p, out, 'utf8')
}

function patchPackageLock(oldSlug, newSlug, dryRun) {
  const p = path.join(ROOT, 'package-lock.json')
  if (!fs.existsSync(p)) {
    console.warn('Aviso: package-lock.json não encontrado; execute npm install depois.')
    return
  }
  const data = JSON.parse(fs.readFileSync(p, 'utf8'))
  if (data.name === oldSlug) data.name = newSlug
  if (data.packages?.['']?.name === oldSlug) data.packages[''].name = newSlug
  const out = JSON.stringify(data, null, 2) + '\n'
  if (dryRun) console.log('[dry-run] gravaria package-lock.json')
  else fs.writeFileSync(p, out, 'utf8')
}

function replaceInFile(relPath, replacers, dryRun) {
  const p = path.join(ROOT, relPath)
  if (!fs.existsSync(p)) return
  let text = fs.readFileSync(p, 'utf8')
  let changed = false
  for (const { from, to } of replacers) {
    if (text.includes(from)) {
      text = text.split(from).join(to)
      changed = true
    }
  }
  if (!changed) return
  if (dryRun) console.log(`[dry-run] gravaria ${relPath}`)
  else fs.writeFileSync(p, text, 'utf8')
}

function patchIndexHtmlTitle(displayTitle, dryRun) {
  const p = path.join(ROOT, 'src', 'index.html')
  if (!fs.existsSync(p)) return
  let text = fs.readFileSync(p, 'utf8')
  const next = text.replace(/<title>[^<]*<\/title>/, `<title>${displayTitle}</title>`)
  if (next === text) return
  if (dryRun) console.log('[dry-run] gravaria src/index.html (<title>)')
  else fs.writeFileSync(p, next, 'utf8')
}

function sleepSync(ms) {
  const end = Date.now() + ms
  while (Date.now() < end) {
    /* espera ocupada — evita dependência de timers no .mjs sync */
  }
}

function psQuote(s) {
  return `'${String(s).replace(/'/g, "''")}'`
}

/**
 * Renomeia pasta no Windows via PowerShell (mais fiável com ficheiros abertos no IDE).
 */
function renameFolderWindowsPowerShell(fromAbs, toName) {
  const parent = path.dirname(fromAbs)
  const cmd = `Rename-Item -LiteralPath ${psQuote(fromAbs)} -NewName ${psQuote(toName)}`
  const r = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', cmd],
    { encoding: 'utf8', windowsHide: true, cwd: parent }
  )
  if (r.status !== 0) {
    const err = (r.stderr || r.stdout || '').trim()
    if (err) console.error('PowerShell:', err)
    return false
  }
  return true
}

/**
 * Renomeia a pasta raiz do repo no disco (pai de /scripts).
 * Grava os ficheiros antes de chamar isto.
 * No Windows: retentativas + PowerShell (Node fs.rename falha muito com EPERM se o Cursor/terminal está na pasta).
 */
function renameProjectRootOnDisk(newFolderName, dryRun) {
  const parent = path.dirname(ROOT)
  const currentName = path.basename(ROOT)
  const fromAbs = path.resolve(parent, currentName)
  const toAbs = path.resolve(parent, newFolderName)
  const isWin = process.platform === 'win32'

  const samePathIgnoringCase = isWin && currentName.toLowerCase() === newFolderName.toLowerCase()
  if (currentName === newFolderName) {
    console.log('  Pasta no disco já corresponde ao nome "' + newFolderName + '"; nada a fazer.')
    return
  }
  if (samePathIgnoringCase && currentName !== newFolderName) {
    /* só mudança de maiúsculas/minúsculas: fluxo especial abaixo */
  } else if (fs.existsSync(toAbs)) {
    console.error(`Erro: já existe "${toAbs}". Escolhe outro --folder ou apaga/mexe nessa pasta.`)
    process.exit(1)
  }

  if (dryRun) {
    console.log(`[dry-run] renomearia pasta no disco: "${currentName}" → "${newFolderName}"`)
    console.log(`           caminho final: ${toAbs}`)
    return
  }

  console.log('\nA renomear pasta no disco…')

  const tryFsRename = () => {
    try {
      process.chdir(parent)
      if (samePathIgnoringCase && currentName !== newFolderName) {
        const tmp = `${currentName}.__tmp_rename__${Date.now()}`
        fs.renameSync(currentName, tmp)
        fs.renameSync(tmp, newFolderName)
      } else {
        fs.renameSync(currentName, newFolderName)
      }
      return true
    } catch (e) {
      return e
    }
  }

  let lastErr = null
  for (let attempt = 1; attempt <= 5; attempt++) {
    const result = tryFsRename()
    if (result === true) {
      console.log('Pasta no disco renomeada:')
      console.log('  ' + toAbs)
      console.log('  Abre esta pasta no Cursor/VS Code (Ficheiro → Abrir pasta).')
      return
    }
    lastErr = result
    const code = result && result.code
    if (code === 'EPERM' || code === 'EBUSY' || code === 'EACCES' || code === 'UNKNOWN') {
      console.warn(`  Tentativa ${attempt}/5 (ficheiros em uso?)…`)
      sleepSync(500)
      continue
    }
    break
  }

  if (isWin) {
    console.warn('  A tentar via PowerShell…')
    if (samePathIgnoringCase && currentName !== newFolderName) {
      const tmp = `${currentName}.__tmp_rename__${Date.now()}`
      if (
        renameFolderWindowsPowerShell(fromAbs, tmp) &&
        renameFolderWindowsPowerShell(path.join(parent, tmp), newFolderName)
      ) {
        console.log('Pasta no disco renomeada (PowerShell):')
        console.log('  ' + toAbs)
        return
      }
    } else if (renameFolderWindowsPowerShell(fromAbs, newFolderName)) {
      console.log('Pasta no disco renomeada (PowerShell):')
      console.log('  ' + toAbs)
      return
    }
  }

  console.error('Erro ao renomear a pasta:', lastErr ? lastErr.message : 'desconhecido')
  console.error('Fecha o Cursor nesta pasta, abre o PowerShell na pasta pai e corre:')
  console.error(`  Set-Location ${psQuote(parent)}; Rename-Item -LiteralPath ${psQuote(currentName)} -NewName ${psQuote(newFolderName)}`)
  process.exit(1)
}

function main() {
  const { dryRun, slug, title: titleArg, folderName: folderArg, fromSlug: fromArg, renameFolder } =
    parseArgs(process.argv)
  const oldSlug = detectOldSlug(fromArg || undefined)
  assertValidNewPackageSlug(slug, oldSlug)
  const displayTitle = titleArg || slugToTitle(slug)
  const diskFolderName = folderArg || slug
  if (renameFolder) assertValidFolderName(diskFolderName)

  console.log(dryRun ? 'Simulação (dry-run):' : 'A renomear projeto…')
  console.log(`  Nome atual (detetado): "${oldSlug}"`)
  console.log(`  Package / projeto Angular: "${oldSlug}" → "${slug}"`)
  console.log(`  Título (UI / separador): "${displayTitle}"`)
  if (renameFolder) {
    console.log(
      `  Pasta no disco: "${path.basename(ROOT)}" → "${diskFolderName}"` +
        (folderArg ? ' (--folder)' : ' (= slug)')
    )
  } else {
    console.log('  Pasta no disco: sem alteração (--no-rename-folder)')
  }

  patchAngularJson(oldSlug, slug, dryRun)
  patchPackageJson(oldSlug, slug, dryRun)
  patchPackageLock(oldSlug, slug, dryRun)

  replaceInFile(
    'src/app/app.component.ts',
    [
      { from: `title = '${oldSlug}'`, to: `title = '${displayTitle.replace(/'/g, "\\'")}'` },
      { from: `title = "${oldSlug}"`, to: `title = "${displayTitle.replace(/"/g, '\\"')}"` }
    ],
    dryRun
  )

  replaceInFile(
    'src/app/app.component.spec.ts',
    [
      { from: `'${oldSlug}'`, to: `'${displayTitle.replace(/'/g, "\\'")}'` },
      { from: `"${oldSlug}"`, to: `"${displayTitle.replace(/"/g, '\\"')}"` }
    ],
    dryRun
  )

  patchIndexHtmlTitle(displayTitle, dryRun)

  if (renameFolder) {
    renameProjectRootOnDisk(diskFolderName, dryRun)
  }

  console.log(dryRun ? '\nNada foi gravado (nem pasta renomeada). Retire --dry-run para aplicar.' : '\nFicheiros de projeto atualizados.')
  console.log('Sugestões:')
  console.log('  • Pasta de build: dist/' + slug)
  console.log('  • Opcional: apagar .angular/cache se o CLI reclamar do nome antigo.')
}

main()
