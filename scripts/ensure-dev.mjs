import { copyFileSync } from 'node:fs'
import { join } from 'node:path'

copyFileSync(join(process.cwd(), 'vite.index.html'), join(process.cwd(), 'index.html'))
console.log('index.html restaurado para desenvolvimento (Vite)')
