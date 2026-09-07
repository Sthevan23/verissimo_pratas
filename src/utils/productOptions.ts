import type { ProductOption } from '../types'

function slugifyOptionId(label: string): string {
  return (
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'opcao'
  )
}

/** Divide valores: vírgula, barra, ponto-e-vírgula, pipe ou " ou " */
function splitOptionValues(raw: string): string[] {
  return raw
    .split(/\s*(?:,|;|\/|\||\sou\s)\s*/i)
    .map((v) => v.trim())
    .filter(Boolean)
}

/** Texto do admin → opções do produto */
export function parseProductOptions(text: string): ProductOption[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(':')
      const dashIdx = line.search(/\s[-–—]\s/)

      let label = ''
      let valuesRaw = ''

      if (colonIdx >= 0) {
        label = line.slice(0, colonIdx).trim()
        valuesRaw = line.slice(colonIdx + 1)
      } else if (dashIdx >= 0) {
        label = line.slice(0, dashIdx).trim()
        valuesRaw = line.slice(dashIdx).replace(/^\s*[-–—]\s*/, '')
      } else {
        // Só valores: "Corações, Círculos" ou "Corações / Círculos"
        const values = splitOptionValues(line)
        if (values.length < 2) return null
        return { id: 'modelo', label: 'Modelo', values }
      }

      const values = splitOptionValues(valuesRaw)
      if (!label || values.length === 0) return null
      return { id: slugifyOptionId(label), label, values }
    })
    .filter((o): o is ProductOption => o !== null)
}

/** Opções do produto → texto para o admin */
export function formatProductOptions(options?: ProductOption[]): string {
  if (!options?.length) return ''
  return options.map((o) => `${o.label}: ${o.values.join(', ')}`).join('\n')
}
