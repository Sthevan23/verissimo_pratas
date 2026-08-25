import { products as seedProducts } from '../data/seedProducts'
import { categories as seedCategories } from '../data/categories'
import { resolveProductSizes } from '../data/sizes'
import type {
  AdminDatabase,
  AdminProduct,
  AdminCategory,
  DashboardStats,
  SalesChartPoint,
  TopProduct,
  Order,
  OrderStatus,
} from '../types/admin'
import { getSession } from './authService'

const STORAGE_KEY = 'verissimo-admin-db-v5'

function uid() {
  return crypto.randomUUID()
}

function now() {
  return new Date().toISOString()
}

function toAdminProduct(p: (typeof seedProducts)[0], index: number): AdminProduct {
  const cost = Math.round(p.price * 0.42)
  return {
    id: p.id,
    slug: p.slug,
    sku: `VP-${String(index + 1).padStart(4, '0')}`,
    name: p.name,
    shortDescription: p.description.slice(0, 120) + '...',
    description: p.description,
    category: p.category,
    brand: 'Verissimo Pratas',
    price: p.price,
    salePrice: p.salePrice,
    costPrice: cost,
    images: p.images,
    badge: p.badge,
    rating: p.rating,
    reviewCount: p.reviewCount,
    stock: p.inStock ? Math.floor(Math.random() * 20) + 3 : 0,
    minStock: 5,
    trackStock: true,
    inStock: p.inStock,
    material: p.material,
    silverType: 'Prata 925',
    warranty: p.warranty,
    care: p.care,
    shippingDays: p.shippingDays,
    sizes: resolveProductSizes(p.category, p.sizes),
    seoTitle: `${p.name} | Verissimo Pratas 925`,
    seoDescription: p.description.slice(0, 160),
    status: 'active',
    isNew: p.isNew,
    isFeatured: p.isFeatured,
    isOnSale: p.isOnSale,
    createdAt: now(),
    updatedAt: now(),
  }
}

function createSeedDatabase(): AdminDatabase {
  const adminProducts = seedProducts.map(toAdminProduct)

  const categories: AdminCategory[] = [
    ...seedCategories.map((c, i) => ({
      id: uid(),
      slug: c.slug,
      name: c.name,
      image: c.image,
      description: c.description,
      order: i,
      active: true,
    })),
    {
      id: uid(),
      slug: 'promocoes',
      name: 'Promoções',
      image: seedCategories[0].image,
      description: 'Peças em oferta especial',
      order: seedCategories.length,
      active: true,
    },
  ]

  const customers = [
    { id: uid(), name: 'Camila Ribeiro', email: 'camila@email.com', phone: '(19) 99999-1234', cpf: '123.456.789-00', totalOrders: 0, totalSpent: 0, lastPurchase: '', createdAt: daysAgo(90) },
    { id: uid(), name: 'Juliana Martins', email: 'juliana@email.com', phone: '(19) 98888-5678', totalOrders: 0, totalSpent: 0, lastPurchase: '', createdAt: daysAgo(120) },
    { id: uid(), name: 'Fernanda Lima', email: 'fernanda@email.com', phone: '(19) 97777-9012', totalOrders: 0, totalSpent: 0, lastPurchase: '', createdAt: daysAgo(60) },
  ]

  const orders: Order[] = []

  return {
    products: adminProducts,
    categories,
    orders,
    customers,
    coupons: [
      { id: uid(), code: 'VERISSIMO10', type: 'percentual', value: 10, minPurchase: 100, usageLimit: 100, usageCount: 0, startsAt: daysAgo(30), expiresAt: daysFromNow(60), active: true },
      { id: uid(), code: 'PRATA15', type: 'percentual', value: 15, minPurchase: 200, usageLimit: 50, usageCount: 0, startsAt: daysAgo(10), expiresAt: daysFromNow(20), active: true },
    ],
    reviews: [],
    transactions: [],
    payables: [],
    receivables: [],
    inventoryMovements: [],
    adminUsers: [
      { id: uid(), name: 'Administrador', email: import.meta.env.VITE_ADMIN_EMAIL || 'verissimopratass@gmail.com', role: 'administrador', active: true, createdAt: now() },
      { id: uid(), name: 'Gerente Loja', email: 'gerente@verissimopratas.com.br', role: 'gerente', active: true, createdAt: now() },
      { id: uid(), name: 'Editor Conteúdo', email: 'editor@verissimopratas.com.br', role: 'editor', active: true, createdAt: now() },
    ],
    settings: {
      storeName: 'Verissimo Pratas 925',
      logo: '',
      favicon: '/favicon.svg',
      email: 'verissimopratass@gmail.com',
      phone: '(35) 99124-0681',
      whatsapp: '5535991240681',
      // link oficial: api.whatsapp.com/message/UJC2GNIKLZX4K1
      address: 'Boa Esperança — Brasil',
      instagram: '@verissimopratas',
      facebook: 'verissimopratas',
      tiktok: '@verissimopratas',
      freeShippingMin: 499,
      minOrder: 0,
      maxInstallments: 6,
      heroTitle: 'Elegância que permanece.',
      heroSubtitle: 'Descubra peças em prata pensadas para transformar momentos em memórias.',
    },
    auditLog: [],
  }
}

function daysAgo(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

function daysFromNow(n: number) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function getDatabase(): AdminDatabase {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as AdminDatabase
    } catch {
      /* fall through */
    }
  }
  const db = createSeedDatabase()
  saveDatabase(db)
  return db
}

export function saveDatabase(db: AdminDatabase): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

export function addAudit(action: string, entity: string, entityId: string, details: string): void {
  const db = getDatabase()
  const session = getSession()
  db.auditLog.unshift({
    id: uid(),
    adminId: session?.userId ?? 'system',
    adminName: session?.name ?? 'Sistema',
    action,
    entity,
    entityId,
    details,
    createdAt: now(),
  })
  if (db.auditLog.length > 200) db.auditLog = db.auditLog.slice(0, 200)
  saveDatabase(db)
}

// ─── Products ───

export function getAdminProducts(): AdminProduct[] {
  return getDatabase().products.filter((p) => p.status !== 'archived')
}

export function getAdminProduct(id: string): AdminProduct | undefined {
  return getDatabase().products.find((p) => p.id === id)
}

export function saveProduct(product: AdminProduct): AdminProduct {
  const db = getDatabase()
  const idx = db.products.findIndex((p) => p.id === product.id)
  product.updatedAt = now()
  if (idx >= 0) {
    const old = db.products[idx]
    db.products[idx] = product
    if (old.price !== product.price) {
      addAudit('update', 'product', product.id, `Alterou o preço de ${product.name} de R$ ${old.price.toFixed(2)} para R$ ${product.price.toFixed(2)}`)
    }
  } else {
    product.createdAt = now()
    db.products.push(product)
    addAudit('create', 'product', product.id, `Criou o produto ${product.name}`)
  }
  saveDatabase(db)
  return product
}

export function deleteProduct(id: string): void {
  const db = getDatabase()
  const p = db.products.find((x) => x.id === id)
  db.products = db.products.filter((x) => x.id !== id)
  saveDatabase(db)
  if (p) addAudit('delete', 'product', id, `Excluiu o produto ${p.name}`)
}

export function archiveProduct(id: string): void {
  const db = getDatabase()
  const p = db.products.find((x) => x.id === id)
  if (p) { p.status = 'archived'; p.updatedAt = now(); saveDatabase(db); addAudit('archive', 'product', id, `Arquivou ${p.name}`) }
}

export function duplicateProduct(id: string): AdminProduct {
  const original = getAdminProduct(id)!
  const copy: AdminProduct = {
    ...original,
    id: uid(),
    slug: original.slug + '-copia-' + Date.now(),
    sku: original.sku + '-CP',
    name: original.name + ' (Cópia)',
    status: 'draft',
    createdAt: now(),
    updatedAt: now(),
  }
  return saveProduct(copy)
}

export function bulkUpdateProducts(ids: string[], updates: Partial<AdminProduct>): void {
  const db = getDatabase()
  db.products = db.products.map((p) =>
    ids.includes(p.id) ? { ...p, ...updates, updatedAt: now() } : p
  )
  saveDatabase(db)
  addAudit('bulk_update', 'product', ids.join(','), `Atualização em massa de ${ids.length} produtos`)
}

// ─── Orders ───

export function getOrders(): Order[] {
  return getDatabase().orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getOrder(id: string): Order | undefined {
  return getDatabase().orders.find((o) => o.id === id)
}

export function updateOrderStatus(id: string, status: OrderStatus): void {
  const db = getDatabase()
  const o = db.orders.find((x) => x.id === id)
  if (o) { o.status = status; o.updatedAt = now(); saveDatabase(db); addAudit('update', 'order', id, `Alterou status do pedido ${o.orderNumber} para ${status}`) }
}

// ─── Dashboard ───

export function getDashboardStats(): DashboardStats {
  const db = getDatabase()
  const today = new Date().toDateString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const paidOrders = db.orders.filter((o) => o.paymentStatus === 'pago')
  const todayOrders = paidOrders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const monthOrders = paidOrders.filter((o) => new Date(o.createdAt) >= monthStart)

  const salesToday = todayOrders.reduce((s, o) => s + o.total, 0)
  const salesMonth = monthOrders.reduce((s, o) => s + o.total, 0)
  const avgTicket = paidOrders.length ? paidOrders.reduce((s, o) => s + o.total, 0) / paidOrders.length : 0
  const lowStock = db.products.filter((p) => p.trackStock && p.stock <= p.minStock && p.stock > 0).length

  const costs = monthOrders.reduce((s, o) => {
    return s + o.items.reduce((cs, item) => {
      const prod = db.products.find((p) => p.id === item.productId)
      return cs + (prod?.costPrice ?? 0) * item.quantity
    }, 0)
  }, 0)

  const expenses = db.transactions.filter((t) => t.type === 'saida' && new Date(t.date) >= monthStart).reduce((s, t) => s + t.amount, 0)

  return {
    salesToday,
    salesMonth,
    ordersCount: paidOrders.length,
    avgTicket,
    productsCount: db.products.filter((p) => p.status === 'active').length,
    lowStockCount: lowStock,
    salesTodayChange: 0,
    salesMonthChange: 0,
    ordersChange: 0,
    ticketChange: 0,
    grossRevenue: salesMonth,
    netRevenue: salesMonth - costs - expenses,
    costs,
    profit: salesMonth - costs - expenses,
    expenses,
  }
}

export function getSalesChart(days: number): SalesChartPoint[] {
  const db = getDatabase()
  const points: SalesChartPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayOrders = db.orders.filter(
      (o) => o.paymentStatus === 'pago' && o.createdAt.startsWith(dateStr)
    )
    points.push({
      date: dateStr,
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: days > 30 ? 'short' : '2-digit' }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    })
  }
  return points
}

export function getTopProducts(limit = 5): TopProduct[] {
  const db = getDatabase()
  const map = new Map<string, { qty: number; rev: number }>()
  db.orders.filter((o) => o.paymentStatus === 'pago').forEach((o) => {
    o.items.forEach((item) => {
      const cur = map.get(item.productId) ?? { qty: 0, rev: 0 }
      cur.qty += item.quantity
      cur.rev += item.unitPrice * item.quantity
      map.set(item.productId, cur)
    })
  })
  return [...map.entries()]
    .map(([productId, data], i) => {
      const p = db.products.find((x) => x.id === productId)!
      return { rank: i + 1, productId, name: p?.name ?? '—', image: p?.images[0] ?? '', category: p?.category ?? '', quantitySold: data.qty, revenue: data.rev }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

// ─── Inventory ───

export function adjustStock(productId: string, delta: number, reason: string): void {
  const db = getDatabase()
  const p = db.products.find((x) => x.id === productId)
  if (!p) return
  const prev = p.stock
  p.stock = Math.max(0, p.stock + delta)
  p.inStock = p.stock > 0
  p.updatedAt = now()
  db.inventoryMovements.unshift({
    id: uid(),
    productId,
    productName: p.name,
    type: delta > 0 ? 'entrada' : delta < 0 ? 'saida' : 'ajuste',
    quantity: Math.abs(delta),
    previousStock: prev,
    newStock: p.stock,
    reason,
    adminName: getSession()?.name ?? 'Admin',
    createdAt: now(),
  })
  saveDatabase(db)
}

export function setStock(productId: string, quantity: number, reason: string): void {
  const db = getDatabase()
  const p = db.products.find((x) => x.id === productId)
  if (!p) return
  const prev = p.stock
  p.stock = Math.max(0, quantity)
  p.inStock = p.stock > 0
  p.updatedAt = now()
  db.inventoryMovements.unshift({
    id: uid(),
    productId,
    productName: p.name,
    type: 'ajuste',
    quantity,
    previousStock: prev,
    newStock: p.stock,
    reason,
    adminName: getSession()?.name ?? 'Admin',
    createdAt: now(),
  })
  saveDatabase(db)
}

// ─── Generic getters ───

export function getDb() { return getDatabase() }
export function saveDb(db: AdminDatabase) { saveDatabase(db) }
