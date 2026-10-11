import { getAdminProduct } from '../services/adminStore'
import { normalizeProductImageUrl } from '../services/remoteCatalog'

/** Foto do item do pedido (salva no pedido ou fallback do catálogo). */
export function resolveOrderItemImage(item: {
  productId: string
  productImage?: string
}): string {
  const raw = (item.productImage ?? '').trim()
  if (raw) return normalizeProductImageUrl(raw)
  const fromCatalog = getAdminProduct(item.productId)?.images?.[0]
  if (fromCatalog) return normalizeProductImageUrl(fromCatalog.trim())
  return ''
}
