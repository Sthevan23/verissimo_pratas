import type { DashboardStats, Order, SalesChartPoint, TopProduct } from '../types/admin'
import type { AdminProduct } from '../types/admin'

/** Pedido conta como venda concluída (faturamento). */
export function isOrderRevenueCountable(order: Order): boolean {
  if (order.status === 'cancelado') return false
  if (order.paymentStatus === 'pago') return true
  return ['pago', 'em_preparacao', 'enviado', 'entregue'].includes(order.status)
}

export function filterRevenueOrders(orders: Order[]): Order[] {
  return orders.filter(isOrderRevenueCountable)
}

export function computeDashboardStatsFromOrders(
  orders: Order[],
  products: AdminProduct[],
  localExpensesMonth = 0
): DashboardStats {
  const today = new Date().toDateString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)

  const paidOrders = filterRevenueOrders(orders)
  const todayOrders = paidOrders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const monthOrders = paidOrders.filter((o) => new Date(o.createdAt) >= monthStart)

  const salesToday = todayOrders.reduce((s, o) => s + o.total, 0)
  const salesMonth = monthOrders.reduce((s, o) => s + o.total, 0)
  const avgTicket = paidOrders.length
    ? paidOrders.reduce((s, o) => s + o.total, 0) / paidOrders.length
    : 0

  const productById = new Map(products.map((p) => [p.id, p]))
  const lowStock = products.filter((p) => p.status === 'active' && Number(p.stock) <= 0).length

  const costs = monthOrders.reduce((s, o) => {
    return (
      s +
      o.items.reduce((cs, item) => {
        const prod = productById.get(item.productId)
        return cs + (prod?.costPrice ?? 0) * item.quantity
      }, 0)
    )
  }, 0)

  const expenses = localExpensesMonth

  return {
    salesToday,
    salesMonth,
    ordersCount: paidOrders.length,
    avgTicket,
    productsCount: products.filter((p) => p.status === 'active').length,
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

export function computeSalesChartFromOrders(orders: Order[], days: number): SalesChartPoint[] {
  const paid = filterRevenueOrders(orders)
  const points: SalesChartPoint[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    const dayOrders = paid.filter((o) => o.createdAt.startsWith(dateStr))
    points.push({
      date: dateStr,
      label: d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: days > 30 ? 'short' : '2-digit',
      }),
      revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      orders: dayOrders.length,
    })
  }
  return points
}

export function computeTopProductsFromOrders(
  orders: Order[],
  products: AdminProduct[],
  limit = 5
): TopProduct[] {
  const paid = filterRevenueOrders(orders)
  const map = new Map<string, { qty: number; rev: number }>()
  paid.forEach((o) => {
    o.items.forEach((item) => {
      const cur = map.get(item.productId) ?? { qty: 0, rev: 0 }
      cur.qty += item.quantity
      cur.rev += item.unitPrice * item.quantity
      map.set(item.productId, cur)
    })
  })
  const productById = new Map(products.map((p) => [p.id, p]))
  return [...map.entries()]
    .map(([productId, data]) => {
      const p = productById.get(productId)
      return {
        rank: 0,
        productId,
        name: p?.name ?? itemLabel(productId),
        image: p?.images[0] ?? '',
        category: p?.category ?? '',
        quantitySold: data.qty,
        revenue: data.rev,
      }
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, limit)
    .map((p, i) => ({ ...p, rank: i + 1 }))
}

function itemLabel(productId: string): string {
  return productId ? `Produto ${productId.slice(0, 8)}` : '—'
}

export function monthLocalExpenses(
  transactions: { type: string; amount: number; date: string }[]
): number {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  return transactions
    .filter((t) => t.type === 'saida' && new Date(t.date) >= monthStart)
    .reduce((s, t) => s + t.amount, 0)
}
