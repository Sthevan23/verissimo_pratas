/** Grade da vitrine — ~1080px para ficar nítida em telas retina (2 colunas no celular). */
export const CATALOG_CARD_IMAGE_WIDTH = 1080

/** Miniaturas na ficha do produto */
export const CATALOG_THUMB_IMAGE_WIDTH = 720

function withMediaWidth(url: string, width: number): string {
  const raw = url.trim()
  if (!raw.includes('media.php')) return raw

  try {
    const base =
      typeof window !== 'undefined' && raw.startsWith('/')
        ? new URL(raw, window.location.origin)
        : new URL(raw, 'https://local.invalid')
    if (!base.pathname.includes('media.php')) return raw
    base.searchParams.set('w', String(width))
    base.searchParams.set('q', '92')
    return raw.startsWith('http') ? base.toString() : `${base.pathname}${base.search}`
  } catch {
    const join = raw.includes('?') ? '&' : '?'
    return `${raw}${join}w=${width}`
  }
}

/** Remove redimensionamento — foto original do servidor */
function withoutMediaWidth(url: string): string {
  if (!url.includes('media.php')) return url
  try {
    const base =
      typeof window !== 'undefined' && url.startsWith('/')
        ? new URL(url, window.location.origin)
        : new URL(url, 'https://local.invalid')
    base.searchParams.delete('w')
    const out = url.startsWith('http') ? base.toString() : `${base.pathname}${base.search}`
    return out
  } catch {
    return url.replace(/([?&])w=\d+&?/, '$1').replace(/[?&]$/, '')
  }
}

export function catalogCardImageUrl(url: string | undefined | null): string {
  const raw = (url ?? '').trim()
  if (!raw) return ''
  return withMediaWidth(raw, CATALOG_CARD_IMAGE_WIDTH)
}

/** Foto grande na página do produto — qualidade máxima (sem ?w=) */
export function catalogDetailImageUrl(url: string | undefined | null): string {
  const raw = (url ?? '').trim()
  if (!raw) return ''
  return withoutMediaWidth(raw)
}

export function catalogThumbImageUrl(url: string | undefined | null): string {
  const raw = (url ?? '').trim()
  if (!raw) return ''
  return withMediaWidth(raw, CATALOG_THUMB_IMAGE_WIDTH)
}
