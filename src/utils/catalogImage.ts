/** Largura máxima pedida ao servidor para cards da vitrine (menos bytes). */
export const CATALOG_CARD_IMAGE_WIDTH = 480

/**
 * URL otimizada para grade de produtos. Só altera links servidos por media.php.
 */
export function catalogCardImageUrl(url: string | undefined | null): string {
  const raw = (url ?? '').trim()
  if (!raw) return ''
  if (!raw.includes('media.php')) return raw

  try {
    const base =
      typeof window !== 'undefined' && raw.startsWith('/')
        ? new URL(raw, window.location.origin)
        : new URL(raw, 'https://local.invalid')
    if (!base.pathname.includes('media.php')) return raw
    base.searchParams.set('w', String(CATALOG_CARD_IMAGE_WIDTH))
    return raw.startsWith('http') ? base.toString() : `${base.pathname}${base.search}`
  } catch {
    const join = raw.includes('?') ? '&' : '?'
    return `${raw}${join}w=${CATALOG_CARD_IMAGE_WIDTH}`
  }
}
