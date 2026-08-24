/**
 * Hostinger clona o repo inteiro em public_html.
 * Este script:
 * 1) usa vite.index.html para o build
 * 2) publica dist + api na raiz do projeto (e em deploy/public_html)
 */
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
  copyFileSync,
} from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()
const viteIndex = join(root, 'vite.index.html')
const indexHtml = join(root, 'index.html')
const dist = join(root, 'dist')
const apiSrc = join(root, 'api')
const deploy = join(root, 'deploy', 'public_html')
const publicHtaccess = join(root, 'public', '.htaccess')

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true })
}

// 1. Garantir index.html de desenvolvimento para o Vite
if (!existsSync(viteIndex)) {
  console.error('vite.index.html não encontrado')
  process.exit(1)
}
copyFileSync(viteIndex, indexHtml)

// 2. Build Vite
execSync('npx tsc -b && npx vite build', { stdio: 'inherit', cwd: root })

if (!existsSync(dist)) {
  console.error('dist/ não gerado')
  process.exit(1)
}

// 3. Preservar senha MySQL do deploy
const existingLocalPath = join(deploy, 'api', 'config.local.php')
const rootLocalPath = join(root, 'api', 'config.local.php')
const savedLocal = existsSync(existingLocalPath)
  ? readFileSync(existingLocalPath, 'utf8')
  : existsSync(rootLocalPath)
    ? readFileSync(rootLocalPath, 'utf8')
    : null

// 4. API no dist (sem config.local)
const distApi = join(dist, 'api')
if (existsSync(distApi)) rmSync(distApi, { recursive: true, force: true })
copyDir(apiSrc, distApi)
const distLocal = join(distApi, 'config.local.php')
if (existsSync(distLocal)) rmSync(distLocal, { force: true })
if (existsSync(publicHtaccess)) {
  copyFileSync(publicHtaccess, join(dist, '.htaccess'))
}

// 5. Publicar na raiz (o que a Hostinger serve)
const rootAssets = join(root, 'assets')
if (existsSync(rootAssets)) rmSync(rootAssets, { recursive: true, force: true })
copyDir(join(dist, 'assets'), rootAssets)
copyFileSync(join(dist, 'index.html'), indexHtml)
if (existsSync(join(dist, '.htaccess'))) {
  copyFileSync(join(dist, '.htaccess'), join(root, '.htaccess'))
}
if (existsSync(join(dist, 'favicon.svg'))) {
  copyFileSync(join(dist, 'favicon.svg'), join(root, 'favicon.svg'))
}
if (existsSync(join(dist, 'icons.svg'))) {
  copyFileSync(join(dist, 'icons.svg'), join(root, 'icons.svg'))
}

// Pasta de fotos de produtos (public/products → raiz + deploy)
const distProducts = join(dist, 'products')
if (existsSync(distProducts)) {
  const rootProducts = join(root, 'products')
  if (existsSync(rootProducts)) rmSync(rootProducts, { recursive: true, force: true })
  copyDir(distProducts, rootProducts)
}

// API na raiz (com senha se houver)
const rootApi = join(root, 'api')
// não apagar api/ fonte — só garantir arquivos PHP de produção
for (const file of ['config.php', 'config.local.example.php', 'db.php', 'ping.php', 'ping-db.php', '.htaccess']) {
  const src = join(apiSrc, file)
  if (existsSync(src)) copyFileSync(src, join(rootApi, file))
}
if (savedLocal) {
  writeFileSync(join(rootApi, 'config.local.php'), savedLocal, 'utf8')
}

// 6. Sincronizar deploy/public_html
if (existsSync(deploy)) rmSync(deploy, { recursive: true, force: true })
copyDir(dist, deploy)
if (savedLocal) {
  mkdirSync(join(deploy, 'api'), { recursive: true })
  writeFileSync(join(deploy, 'api', 'config.local.php'), savedLocal, 'utf8')
}

console.log('Build publicado na raiz + deploy/public_html (pronto para Hostinger Git)')
