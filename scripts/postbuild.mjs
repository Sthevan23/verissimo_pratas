/**
 * Após o Vite build: copia API + sincroniza deploy/public_html
 */
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const dist = join(root, 'dist')
const apiSrc = join(root, 'api')
const deploy = join(root, 'deploy', 'public_html')

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  cpSync(src, dest, { recursive: true })
}

if (!existsSync(dist)) {
  console.error('dist/ não encontrado. Rode vite build antes.')
  process.exit(1)
}

// Preserva senha MySQL se já existir no deploy
const existingLocalPath = join(deploy, 'api', 'config.local.php')
const savedLocal = existsSync(existingLocalPath)
  ? readFileSync(existingLocalPath, 'utf8')
  : null

// API no dist (sem config.local.php)
const distApi = join(dist, 'api')
if (existsSync(distApi)) rmSync(distApi, { recursive: true, force: true })
copyDir(apiSrc, distApi)
const distLocal = join(distApi, 'config.local.php')
if (existsSync(distLocal)) rmSync(distLocal, { force: true })

// Recria deploy/public_html a partir do dist
if (existsSync(deploy)) rmSync(deploy, { recursive: true, force: true })
copyDir(dist, deploy)

if (savedLocal) {
  mkdirSync(join(deploy, 'api'), { recursive: true })
  writeFileSync(join(deploy, 'api', 'config.local.php'), savedLocal, 'utf8')
}

console.log('postbuild: dist/ + deploy/public_html atualizados')
