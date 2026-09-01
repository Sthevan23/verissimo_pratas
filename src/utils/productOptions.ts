import type { ProductOption } from '../types'

/** Texto do admin → opções do produto */
export function parseProductOptions(text: string): ProductOption[] {
  return text
    .split('\n')
    .map((line) => {
      const idx = line.indexOf(':')
      if (idx < 0) return null
      const label = line.slice(0, idx).trim()
      const values = line
        .slice(idx + 1)
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean)
      if (!label || values.length === 0) return null
      const id = label
        .toLowerCase()
        .normalize('NFD')
        .replace(/\p{M}/gu, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      return { id: id || 'opcao', label, values }
    })
    .filter((o): o is ProductOption => o !== null)
}

/** Opções do produto → texto para o admin */
export function formatProductOptions(options?: ProductOption[]): string {
  if (!options?.length) return ''
  return options.map((o) => `${o.label}: ${o.values.join(', ')}`).join('\n')
}
