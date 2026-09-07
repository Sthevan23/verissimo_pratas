import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Minus } from 'lucide-react'
import { PageHeader } from '../../components/admin/Modal'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { getAdminProducts, adjustStock, setStock, getDatabase } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import type { StockStatus } from '../../types/admin'

/** Disponível com qualquer quantidade > 0. Sem alerta de “mínimo”. */
function getStockStatus(stock: number): StockStatus {
  return stock <= 0 ? 'esgotado' : 'em_estoque'
}

export function AdminInventory() {
  const { showToast } = useAdminToast()
  const [refresh, setRefresh] = useState(0)
  const products = useMemo(() => {
    void refresh
    return getAdminProducts()
  }, [refresh])
  const movements = useMemo(() => getDatabase().inventoryMovements.slice(0, 10), [refresh])

  return (
    <>
      <Helmet><title>Estoque — Verissimo Admin</title></Helmet>
      <PageHeader
        title="Estoque"
        subtitle="Coloque a quantidade real de cada peça. Com 1 ou mais, aparece disponível no site."
      />

      <div className="admin-card overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="admin-table-th">Produto</th>
                <th className="admin-table-th">SKU</th>
                <th className="admin-table-th">Quantidade</th>
                <th className="admin-table-th">Status</th>
                <th className="admin-table-th">Ajuste</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="admin-table-td">
                    <div className="flex items-center gap-2">
                      <img src={p.images[0]} alt="" className="w-8 h-8 object-cover" />
                      <span className="text-sm truncate max-w-[180px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="admin-table-td text-xs text-muted">{p.sku}</td>
                  <td className="admin-table-td font-medium">{p.stock}</td>
                  <td className="admin-table-td"><StatusBadge status={getStockStatus(p.stock)} /></td>
                  <td className="admin-table-td">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          adjustStock(p.id, -1, 'Ajuste manual')
                          showToast('Estoque atualizado e publicado no site.')
                          setRefresh((r) => r + 1)
                        }}
                        className="p-1.5 border border-border hover:bg-off-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          adjustStock(p.id, 1, 'Ajuste manual')
                          showToast('Estoque atualizado e publicado no site.')
                          setRefresh((r) => r + 1)
                        }}
                        className="p-1.5 border border-border hover:bg-off-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          const q = prompt('Definir quantidade:', String(p.stock))
                          if (q !== null && q !== '') {
                            setStock(p.id, parseInt(q, 10) || 0, 'Definição manual')
                            showToast('Estoque definido e publicado no site.')
                            setRefresh((r) => r + 1)
                          }
                        }}
                        className="px-2 py-1 text-[10px] border border-border uppercase tracking-wider"
                      >
                        Definir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-card p-6">
        <h3 className="font-serif text-lg font-light mb-4">Movimentações recentes</h3>
        {movements.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma movimentação registrada.</p>
        ) : (
          <div className="space-y-2">
            {movements.map((m) => (
              <div key={m.id} className="flex justify-between text-sm py-2 border-b border-border/50">
                <span>{m.productName} — {m.type} ({m.quantity})</span>
                <span className="text-muted">{m.previousStock} → {m.newStock}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
