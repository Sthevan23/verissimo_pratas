/**
 * Upload deploy/public_html → Hostinger FTP/FTPS
 * Uso: node deploy/upload.mjs
 * Credenciais: deploy/.ftp-credentials.json (não versionado)
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'
import { Client } from 'basic-ftp'

const DENY_UPLOAD = [
  /^\.env$/i,
  /\.env\./i,
  /config\.local\.php$/i,
  /\.ftp-credentials\.json$/i,
  /\.sql$/i,
  /\.sqlite$/i,
  /\.log$/i,
  /\/api\/data\//i,
  /sessions\.json$/i,
  /orders\.json$/i,
  /catalog\.json$/i,
]

function shouldSkip(relativePath) {
  const norm = relativePath.replace(/\\/g, '/')
  return DENY_UPLOAD.some((re) => re.test(norm))
}

function loadCredentials() {
  const path = new URL('./.ftp-credentials.json', import.meta.url)
  if (!existsSync(path)) {
    console.error('Arquivo deploy/.ftp-credentials.json não encontrado.')
    process.exit(1)
  }
  let creds
  try {
    creds = JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    console.error('Credenciais FTP inválidas (JSON).')
    process.exit(1)
  }
  for (const key of ['host', 'user', 'password', 'remoteDir']) {
    if (!creds[key] || String(creds[key]).trim() === '') {
      console.error(`Credencial FTP ausente: ${key}`)
      process.exit(1)
    }
  }
  return creds
}

const creds = loadCredentials()
const localDir = join(process.cwd(), 'deploy', 'public_html')

function walk(dir) {
  const files = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) files.push(...walk(full))
    else files.push(full)
  }
  return files
}

const client = new Client(120000)
client.ftp.verbose = false

try {
  console.log('Conectando FTPS…', creds.host)
  await client.access({
    host: creds.host,
    user: creds.user,
    password: creds.password,
    secure: true,
  })

  const remoteBase = String(creds.remoteDir).replace(/\/$/, '')
  console.log('Enviando arquivos para', remoteBase)

  const files = walk(localDir).filter((file) => {
    const rel = relative(localDir, file).replace(/\\/g, '/')
    return !shouldSkip(rel)
  })

  let skipped = 0
  for (const file of walk(localDir)) {
    const rel = relative(localDir, file).replace(/\\/g, '/')
    if (shouldSkip(rel)) {
      skipped++
      continue
    }
    const remote = `${remoteBase}/${rel}`
    const remotePath = remote.substring(0, remote.lastIndexOf('/'))
    await client.ensureDir(remotePath)
    await client.uploadFrom(file, remote)
    console.log('  ✓', rel)
  }

  console.log('\nDeploy concluído:', files.length, 'arquivos enviados;', skipped, 'ignorados por segurança.')
} catch (err) {
  const msg = err instanceof Error ? err.message : String(err)
  console.error('Erro no deploy:', msg.replace(creds.password, '***'))
  process.exit(1)
} finally {
  client.close()
}
