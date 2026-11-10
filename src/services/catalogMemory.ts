import type { AdminProduct, ProductOrder } from '../types/admin'

/** Catálogo em memória para a vitrine (não depende de localStorage corrompido). */
let storefrontProducts: AdminProduct[] | null = null

export function setStorefrontCatalog(products: AdminProduct[]): void {
  storefrontProducts = products
}

export function getStorefrontCatalog(): AdminProduct[] | null {
  return storefrontProducts
}

/** Ordem publicada pelo admin (vem do catálogo remoto). */
let storefrontProductOrder: ProductOrder | null = null

export function setStorefrontProductOrder(order: ProductOrder | null | undefined): void {
  storefrontProductOrder = order ?? null
}

export function getStorefrontProductOrder(): ProductOrder | null {
  return storefrontProductOrder
}
