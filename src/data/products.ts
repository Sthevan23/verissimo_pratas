import type { Product } from '../types'
import {
  getStoreProducts,
  getStoreProductBySlug,
  getStoreProductsByCategory,
  getStoreFeaturedProducts,
  getStoreSaleProducts,
  getStoreRelatedProducts,
  searchStoreProducts,
} from '../services/storeService'

/** Lista ao vivo do catálogo (não cachear em constante de módulo) */
export function getAllProducts(): Product[] {
  return getStoreProducts()
}

/** @deprecated Prefer getAllProducts / getStoreProducts — snapshot pode ficar desatualizado */
export const products: Product[] = getStoreProducts()

export function getProductBySlug(slug: string): Product | undefined {
  return getStoreProductBySlug(slug)
}

export function getProductsByCategory(category: string): Product[] {
  return getStoreProductsByCategory(category)
}

export function getFeaturedProducts(): Product[] {
  return getStoreFeaturedProducts()
}

export function getSaleProducts(): Product[] {
  return getStoreSaleProducts()
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return getStoreRelatedProducts(product, limit)
}

export function searchProducts(query: string): Product[] {
  return searchStoreProducts(query)
}
