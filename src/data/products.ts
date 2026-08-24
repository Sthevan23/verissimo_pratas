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

/** @deprecated Use storeService — kept for backward compatibility */
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
