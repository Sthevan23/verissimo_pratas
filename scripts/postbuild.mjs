/**
 * Hostinger clona o repo inteiro em public_html.
 * Este script:
 * 1) usa vite.index.html para o build
 * 2) publica dist + api na raiz do projeto (e em deploy/public_html)
 */
import { cpSync, existsSync, mkdirSync, rmSync, copyFileSync } from 'node:fs'
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

// 3. API no dist (nunca incluir config.local.php — só no servidor ou api/ local gitignored)
function stripPrivateApiConfig(apiDir) {
  const local = join(apiDir, 'config.local.php')
  if (existsSync(local)) rmSync(local, { force: true })
}

// 4. API no dist (sem config.local)
const distApi = join(dist, 'api')
if (existsSync(distApi)) rmSync(distApi, { recursive: true, force: true })
copyDir(apiSrc, distApi)
stripPrivateApiConfig(distApi)
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

// Pastas estáticas (public/products e public/categories → raiz)
for (const folder of ['products', 'categories']) {
  const distFolder = join(dist, folder)
  if (existsSync(distFolder)) {
    const rootFolder = join(root, folder)
    if (existsSync(rootFolder)) rmSync(rootFolder, { recursive: true, force: true })
    copyDir(distFolder, rootFolder)
  }
}

// API na raiz: não sobrescrever config.local.php (dev local, gitignored)
const rootApi = join(root, 'api')
mkdirSync(join(rootApi, 'data'), { recursive: true })

// Pasta uploads (fotos do painel)
mkdirSync(join(root, 'uploads', 'products'), { recursive: true })

// 6. Sincronizar deploy/public_html
if (existsSync(deploy)) rmSync(deploy, { recursive: true, force: true })
copyDir(dist, deploy)
stripPrivateApiConfig(join(deploy, 'api'))
mkdirSync(join(deploy, 'api', 'data'), { recursive: true })
mkdirSync(join(deploy, 'api', 'data', 'images'), { recursive: true })
if (existsSync(join(apiSrc, 'data', '.htaccess'))) {
  copyFileSync(join(apiSrc, 'data', '.htaccess'), join(deploy, 'api', 'data', '.htaccess'))
}
if (existsSync(join(apiSrc, 'data', 'images', '.htaccess'))) {
  copyFileSync(
    join(apiSrc, 'data', 'images', '.htaccess'),
    join(deploy, 'api', 'data', 'images', '.htaccess')
  )
}
if (existsSync(join(apiSrc, 'data', 'images', '.gitkeep'))) {
  copyFileSync(
    join(apiSrc, 'data', 'images', '.gitkeep'),
    join(deploy, 'api', 'data', 'images', '.gitkeep')
  )
}
for (const file of ['helpers.php', 'upload.php', 'catalog.php', 'media.php', 'shipping.php', 'shipping_logic.php', 'orders.php', 'order_logic.php', 'operational_store.php', 'migrate.php', 'set-superfrete.php', 'auth.php', 'config.php', 'db.php', 'ping.php', 'ping-db.php']) {
  const src = join(apiSrc, file)
  if (existsSync(src)) {
    mkdirSync(join(deploy, 'api'), { recursive: true })
    copyFileSync(src, join(deploy, 'api', file))
  }
}
mkdirSync(join(deploy, 'uploads', 'products'), { recursive: true })
if (existsSync(join(root, 'uploads', 'products', '.htaccess'))) {
  copyFileSync(
    join(root, 'uploads', 'products', '.htaccess'),
    join(deploy, 'uploads', 'products', '.htaccess')
  )
}
  if (existsSync(join(root, 'uploads', 'products', '.gitkeep'))) {
  copyFileSync(
    join(root, 'uploads', 'products', '.gitkeep'),
    join(deploy, 'uploads', 'products', '.gitkeep')
  )
}
stripPrivateApiConfig(join(deploy, 'api'))

execSync('node scripts/verify-tracked-secrets.mjs', { stdio: 'inherit', cwd: root })

console.log(
  'Build publicado na raiz + deploy/public_html (sem config.local.php — configure no servidor Hostinger)'
)
