/**
 * Falha se arquivos sensíveis estiverem rastreados pelo Git.
 * Uso: node scripts/verify-tracked-secrets.mjs
 */
import { execSync } from 'node:child_process'

const tracked = execSync('git ls-files', { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean)

const forbidden = [
  /^api\/config\.local\.php$/i,
  /^deploy\/public_html\/api\/config\.local\.php$/i,
  /^deploy\/\.ftp-credentials\.json$/i,
  /^\.env$/i,
  /\/sessions\.json$/i,
  /\/orders\.json$/i,
  /\/catalog\.json$/i,
  /^api\/data\/(?!\.htaccess|images\/)/i,
]

const bad = tracked.filter((p) => forbidden.some((re) => re.test(p.replace(/\\/g, '/'))))

if (bad.length > 0) {
  console.error('Arquivos sensíveis ainda rastreados pelo Git:')
  for (const p of bad) console.error('  -', p)
  process.exit(1)
}

console.log('OK: nenhum arquivo sensível rastreado (config.local, FTP creds, JSON operacional).')
