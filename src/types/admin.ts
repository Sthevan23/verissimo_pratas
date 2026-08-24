import type { CategorySlug } from './index'

export type AdminRole = 'administrador' | 'gerente' | 'editor'
export type ProductStatus = 'active' | 'draft' | 'archived'
export type OrderStatus =
  | 'pagamento_pendente'
  | 'pago'
  | 'em_preparacao'
  | 'enviado'
  | 'entregue'
  | 'cancelado'
export type PaymentMethod = 'pix' | 'cartao' | 'boleto'
export type CouponType = 'percentual' | 'valor_fixo'
export type ReviewStatus = 'pendente' | 'aprovada' | 'oculta'
export type TransactionType = 'entrada' | 'saida'
export type PayableStatus = 'pendente' | 'pago' | 'atrasado'
export type ReceivableStatus = 'pendente' | 'recebido' | 'atrasado'
export type StockStatus = 'em_estoque' | 'estoque_baixo' | 'esgotado'

export interface AdminUser {
  id: string
  name: string
  email: string
  role: AdminRole
  avatar?: string
  active: boolean
  createdAt: string
}

export interface AdminProduct {
  id: string
  slug: string
  sku: string
  name: string
  shortDescription: string
  description: string
  category: CategorySlug
  subcategory?: string
  brand: string
  price: number
  salePrice?: number
  costPrice: number
  images: string[]
  badge?: 'novidade' | 'promocao' | 'oferta-especial'
  rating: number
  reviewCount: number
  stock: number
  minStock: number
  trackStock: boolean
  inStock: boolean
  material: string
  silverType: string
  weight?: string
  size?: string
  dimensions?: string
  warranty: string
  care: string
  shippingDays: string
  sizes?: string[]
  seoTitle: string
  seoDescription: string
  status: ProductStatus
  isNew?: boolean
  isFeatured?: boolean
  isOnSale?: boolean
  createdAt: string
  updatedAt: string
}

export interface AdminCategory {
  id: string
  slug: CategorySlug | string
  name: string
  image: string
  description: string
  order: number
  active: boolean
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  cpf?: string
  totalOrders: number
  totalSpent: number
  lastPurchase?: string
  createdAt: string
}

export interface OrderItem {
  productId: string
  productName: string
  productImage: string
  quantity: number
  unitPrice: number
  size?: string
}

export interface Order {
  id: string
  orderNumber: string
  customerId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  subtotal: number
  discount: number
  shipping: number
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: 'pendente' | 'pago' | 'reembolsado'
  status: OrderStatus
  shippingAddress: string
  couponCode?: string
  createdAt: string
  updatedAt: string
}

export interface Coupon {
  id: string
  code: string
  type: CouponType
  value: number
  minPurchase: number
  usageLimit: number
  usageCount: number
  startsAt: string
  expiresAt: string
  active: boolean
}

export interface Review {
  id: string
  customerId: string
  customerName: string
  productId: string
  productName: string
  rating: number
  comment: string
  status: ReviewStatus
  createdAt: string
}

export interface FinancialTransaction {
  id: string
  description: string
  category: string
  type: TransactionType
  amount: number
  date: string
  paymentMethod: string
  notes?: string
  status: 'confirmado' | 'pendente'
  createdAt: string
}

export interface Payable {
  id: string
  description: string
  supplier: string
  amount: number
  dueDate: string
  category: string
  status: PayableStatus
  paidAt?: string
}

export interface Receivable {
  id: string
  customerId: string
  customerName: string
  orderId: string
  amount: number
  dueDate: string
  status: ReceivableStatus
  receivedAt?: string
}

export interface InventoryMovement {
  id: string
  productId: string
  productName: string
  type: 'entrada' | 'saida' | 'ajuste'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  adminName: string
  createdAt: string
}

export interface AuditEntry {
  id: string
  adminId: string
  adminName: string
  action: string
  entity: string
  entityId: string
  details: string
  createdAt: string
}

export interface StoreSettings {
  storeName: string
  logo: string
  favicon: string
  email: string
  phone: string
  whatsapp: string
  address: string
  instagram: string
  facebook: string
  tiktok: string
  freeShippingMin: number
  minOrder: number
  maxInstallments: number
  heroTitle: string
  heroSubtitle: string
}

export interface AdminDatabase {
  products: AdminProduct[]
  categories: AdminCategory[]
  orders: Order[]
  customers: Customer[]
  coupons: Coupon[]
  reviews: Review[]
  transactions: FinancialTransaction[]
  payables: Payable[]
  receivables: Receivable[]
  inventoryMovements: InventoryMovement[]
  adminUsers: AdminUser[]
  settings: StoreSettings
  auditLog: AuditEntry[]
}

export interface DashboardStats {
  salesToday: number
  salesMonth: number
  ordersCount: number
  avgTicket: number
  productsCount: number
  lowStockCount: number
  salesTodayChange: number
  salesMonthChange: number
  ordersChange: number
  ticketChange: number
  grossRevenue: number
  netRevenue: number
  costs: number
  profit: number
  expenses: number
}

export interface SalesChartPoint {
  date: string
  label: string
  revenue: number
  orders: number
}

export interface TopProduct {
  rank: number
  productId: string
  name: string
  image: string
  category: string
  quantitySold: number
  revenue: number
}

export const ADMIN_PERMISSIONS: Record<AdminRole, string[]> = {
  administrador: ['*'],
  gerente: ['dashboard', 'products', 'orders', 'inventory', 'finance', 'customers', 'coupons', 'reviews', 'reports'],
  editor: ['dashboard', 'products', 'categories', 'reviews'],
}
