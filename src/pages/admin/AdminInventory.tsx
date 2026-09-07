import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, Minus } from 'lucide-react'
import { PageHeader } from '../../components/admin/Modal'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { getAdminProducts, adjustStock, setStock } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import type { StockStatus } from '../../types/admin'

function getStockStatus(stock: number): StockStatus {
  return stock <= 0 ? 'esgotado' : 'em_estoque'
}

export function AdminInventory() {
  const { showToast } = useAdminToast()
  const [refresh, setRefresh] = useState(0)
  const [draftQty, setDraftQty] = useState<Record<string, string>>({})
  const products = useMemo(() => {
    void refresh
    return getAdminProducts()
  }, [refresh])

  const applyQty = (id: string, current: number) => {
    const raw = draftQty[id]
    if (raw === undefined || raw === '') return
    const qty = Math.max(0, parseInt(raw, 10) || 0)
    if (qty === current) return
    setStock(id, qty, 'Definição manual')
    showToast(qty > 0 ? 'Disponível no site.' : 'Marcado como esgotado no site.')
    setDraftQty((d) => {
      const next = { ...d }
      delete next[id]
      return next
    })
    setRefresh((r) => r + 1)
  }

  return (
    <>
      <Helmet><title>Estoque — Verissimo Admin</title></Helmet>
      <PageHeader
        title="Estoque"
        subtitle="Toque em + / − ou digite a quantidade. Com 1 ou mais, a peça aparece no site."
      />

      <div className="admin-card overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className="admin-table-th">Produto</th>
                <th className="admin-table-th">Qtd</th>
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
                      <span className="text-sm truncate max-w-[200px]">{p.name}</span>
                    </div>
                  </td>
                  <td className="admin-table-td">
                    <input
                      type="number"
                      min={0}
                      className="admin-input w-16 py-1.5 text-center"
                      value={draftQty[p.id] ?? String(p.stock)}
                      onChange={(e) =>
                        setDraftQty((d) => ({ ...d, [p.id]: e.target.value }))
                      }
                      onBlur={() => applyQty(p.id, p.stock)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur()
                        }
                      }}
                    />
                  </td>
                  <td className="admin-table-td">
                    <StatusBadge status={getStockStatus(p.stock)} />
                  </td>
                  <td className="admin-table-td">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          adjustStock(p.id, -1, 'Ajuste manual')
                          showToast(p.stock <= 1 ? 'Esgotado no site.' : 'Estoque atualizado.')
                          setRefresh((r) => r + 1)
                        }}
                        className="p-1.5 border border-border hover:bg-off-white"
                        aria-label="Diminuir"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          adjustStock(p.id, 1, 'Ajuste manual')
                          showToast('Disponível no site.')
                          setRefresh((r) => r + 1)
                        }}
                        className="p-1.5 border border-border hover:bg-off-white"
                        aria-label="Aumentar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStock(p.id, p.stock > 0 ? 0 : 1, 'Toggle disponibilidade')
                          showToast(p.stock > 0 ? 'Esgotado no site.' : 'Disponível no site.')
                          setRefresh((r) => r + 1)
                        }}
                        className="px-2 py-1 text-[10px] border border-border uppercase tracking-wider"
                      >
                        {p.stock > 0 ? 'Esgotar' : 'Liberar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
