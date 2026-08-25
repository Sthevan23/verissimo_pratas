import type { Product, Category } from '../types'
import { getDatabase } from './adminStore'
import { categoryLabels } from '../data/categories'

/** Bridge: storefront reads from admin store (localStorage) when available */
export function getStoreProducts(): Product[] {
  const db = getDatabase()
  return db.products
    .filter((p) => p.status === 'active')
    .map(adminToStoreProduct)
}

export function getStoreProductBySlug(slug: string): Product | undefined {
  return getStoreProducts().find((p) => p.slug === slug)
}

export function getStoreProductsByCategory(category: string): Product[] {
  if (category === 'novidades') return getStoreProducts().filter((p) => p.isNew)
  if (category === 'promocoes') return getStoreProducts().filter((p) => p.isOnSale)
  return getStoreProducts().filter((p) => p.category === category)
}

export function getStoreFeaturedProducts(): Product[] {
  return getStoreProducts().filter((p) => p.isFeatured)
}

export function getStoreSaleProducts(): Product[] {
  return getStoreProducts().filter((p) => p.isOnSale)
}

export function getStoreRelatedProducts(product: Product, limit = 4): Product[] {
  return getStoreProducts()
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit)
}

export function searchStoreProducts(query: string): Product[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return getStoreProducts().filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.includes(q)
  )
}

export function getStoreCategories(): Category[] {
  const db = getDatabase()
  return db.categories
    .filter((c) => c.active)
    .sort((a, b) => a.order - b.order)
    .map((c) => ({
      slug: c.slug as Category['slug'],
      name: c.name,
      image: c.image,
      description: c.description,
    }))
}

export function getStoreCategoryLabels(): Record<string, string> {
  const db = getDatabase()
  const labels: Record<string, string> = { ...categoryLabels }
  db.categories.forEach((c) => { labels[c.slug] = c.name })
  return labels
}

function adminToStoreProduct(p: import('../types/admin').AdminProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description,
    price: p.price,
    salePrice: p.salePrice,
    images: p.images,
    category: p.category,
    badge: p.badge,
    rating: p.rating,
    reviewCount: p.reviewCount,
    inStock: p.inStock && p.stock > 0,
    stock: p.stock,
    material: p.material,
    warranty: p.warranty,
    care: p.care,
    shippingDays: p.shippingDays,
    sizes: p.sizes,
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isOnSale: p.isOnSale,
  }
}
