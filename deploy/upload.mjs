/**
 * Upload deploy/public_html → Hostinger FTP
 * Uso: node deploy/upload.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { Client } from 'basic-ftp'

const creds = JSON.parse(readFileSync(new URL('./.ftp-credentials.json', import.meta.url), 'utf8'))
const localRoot = new URL('./public_html/', import.meta.url).pathname.replace(/^\//, '').replace(/\//g, '\\')
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
  console.log('Conectando FTP…', creds.host)
  await client.access({
    host: creds.host,
    user: creds.user,
    password: creds.password,
    secure: true,
    secureOptions: { rejectUnauthorized: false },
  })

  const remoteBase = creds.remoteDir.replace(/\/$/, '')
  console.log('Enviando arquivos para', remoteBase)

  const files = walk(localDir)
  for (const file of files) {
    const rel = relative(localDir, file).replace(/\\/g, '/')
    const remote = `${remoteBase}/${rel}`
    const remotePath = remote.substring(0, remote.lastIndexOf('/'))
    await client.ensureDir(remotePath)
    await client.uploadFrom(file, remote)
    console.log('  ✓', rel)
  }

  console.log('\nDeploy concluído:', files.length, 'arquivos')
} catch (err) {
  console.error('Erro no deploy:', err.message)
  process.exit(1)
} finally {
  client.close()
}
