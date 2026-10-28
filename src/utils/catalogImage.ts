/** Largura máxima pedida ao servidor — grade da vitrine (leve no 4G). */
export const CATALOG_CARD_IMAGE_WIDTH = 360

/** Página do produto — um pouco maior, ainda comprimida. */
export const CATALOG_DETAIL_IMAGE_WIDTH = 720

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
    return raw.startsWith('http') ? base.toString() : `${base.pathname}${base.search}`
  } catch {
    const join = raw.includes('?') ? '&' : '?'
    return `${raw}${join}w=${width}`
  }
}

export function catalogCardImageUrl(url: string | undefined | null): string {
  const raw = (url ?? '').trim()
  if (!raw) return ''
  return withMediaWidth(raw, CATALOG_CARD_IMAGE_WIDTH)
}

export function catalogDetailImageUrl(url: string | undefined | null): string {
  const raw = (url ?? '').trim()
  if (!raw) return ''
  return withMediaWidth(raw, CATALOG_DETAIL_IMAGE_WIDTH)
}
