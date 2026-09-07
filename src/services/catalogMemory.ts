import type { AdminProduct } from '../types/admin'

/** Catálogo em memória para a vitrine (não depende de localStorage corrompido). */
let storefrontProducts: AdminProduct[] | null = null

export function setStorefrontCatalog(products: AdminProduct[]): void {
  storefrontProducts = products
}

export function getStorefrontCatalog(): AdminProduct[] | null {
  return storefrontProducts
}
