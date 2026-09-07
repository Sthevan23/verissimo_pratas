import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Plus, Search, Copy, Archive, Trash2, Pencil, CloudUpload } from 'lucide-react'
import { PageHeader, ConfirmDialog, EmptyState } from '../../components/admin/Modal'
import { StatusBadge } from '../../components/admin/StatusBadge'
import {
  getAdminProducts,
  saveProduct,
  deleteProduct,
  archiveProduct,
  duplicateProduct,
  bulkUpdateProducts,
  hydrateCatalogFromServer,
  publishCatalogToServer,
  setStock,
} from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice } from '../../utils/format'
import type { AdminProduct } from '../../types/admin'

function AvailabilityBadge({ stock }: { stock: number }) {
  const available = stock > 0
  return (
    <span
      className={`inline-flex text-[10px] tracking-wider uppercase px-2 py-0.5 border ${
        available
          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
          : 'bg-red-50 text-red-700 border-red-200'
      }`}
    >
      {available ? 'Disponível' : 'Esgotado'}
    </span>
  )
}

export function AdminProducts() {
  const { showToast } = useAdminToast()
  const [products, setProducts] = useState(getAdminProducts)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkDiscount, setBulkDiscount] = useState('10')
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [priceValue, setPriceValue] = useState('')
  const [syncing, setSyncing] = useState(false)

  const refresh = useCallback(() => setProducts(getAdminProducts()), [])

  useEffect(() => {
    let alive = true
    ;(async () => {
      setSyncing(true)
      const ok = await hydrateCatalogFromServer({ pushIfEmpty: true })
      if (alive) {
        refresh()
        if (ok) showToast('Catálogo sincronizado com o site.')
        setSyncing(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [refresh, showToast])

  const publishNow = async () => {
    setSyncing(true)
    const result = await publishCatalogToServer()
    refresh()
    setSyncing(false)
    showToast(
      result.ok ? 'Produtos publicados no site!' : result.error || 'Falha ao publicar',
      result.ok ? 'success' : 'error'
    )
  }

  const toggleAvailability = (p: AdminProduct) => {
    if (p.stock > 0) {
      setStock(p.id, 0, 'Marcado como esgotado')
      showToast('Marcado como esgotado no site.')
    } else {
      setStock(p.id, 1, 'Marcado como disponível')
      showToast('Marcado como disponível no site.')
    }
    refresh()
  }

  const filtered = useMemo(() => {
    if (!search) return products
    const q = search.toLowerCase()
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
  }, [products, search])

  const toggleSelect = (id: string) => {
    setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])
  }

  const toggleAll = () => {
    setSelected(selected.length === filtered.length ? [] : filtered.map((p) => p.id))
  }

  const saveInlinePrice = (product: AdminProduct) => {
    const val = parseFloat(priceValue.replace(',', '.'))
    if (isNaN(val) || val <= 0) return
    saveProduct({ ...product, price: val })
    showToast('Preço atualizado.')
    setEditingPrice(null)
    refresh()
  }

  const handleBulkDiscount = () => {
    const pct = parseFloat(bulkDiscount) / 100
    selected.forEach((id) => {
      const p = products.find((x) => x.id === id)!
      saveProduct({ ...p, salePrice: Math.round(p.price * (1 - pct) * 100) / 100, isOnSale: true })
    })
    showToast(`Desconto de ${bulkDiscount}% aplicado a ${selected.length} produtos.`)
    setSelected([])
    setBulkOpen(false)
    refresh()
  }

  return (
    <>
      <Helmet><title>Produtos — Verissimo Admin</title></Helmet>
      <PageHeader
        title="Produtos"
        subtitle={`${filtered.length} produtos${syncing ? ' · sincronizando…' : ''}`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={publishNow}
              disabled={syncing}
              className="admin-btn-secondary text-[10px] disabled:opacity-50"
            >
              <CloudUpload className="w-4 h-4" /> Publicar no site
            </button>
            <Link to="/admin/produtos/novo" className="admin-btn-primary">
              <Plus className="w-4 h-4" /> Novo produto
            </Link>
          </div>
        }
      />

      <div className="admin-card p-4 mb-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" strokeWidth={1.5} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou SKU..."
            className="admin-input pl-10"
          />
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setBulkOpen(true)} className="admin-btn-secondary text-[10px]">
              Aplicar desconto ({selected.length})
            </button>
            <button
              onClick={() => { bulkUpdateProducts(selected, { status: 'archived' }); showToast(`${selected.length} produtos arquivados.`); setSelected([]); refresh() }}
              className="admin-btn-secondary text-[10px]"
            >
              Arquivar
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Nenhum produto encontrado" action={<Link to="/admin/produtos/novo" className="admin-btn-primary">Criar produto</Link>} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="admin-card overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="admin-table-th w-10"><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                  <th className="admin-table-th">Produto</th>
                  <th className="admin-table-th">SKU</th>
                  <th className="admin-table-th">Categoria</th>
                  <th className="admin-table-th">Preço</th>
                  <th className="admin-table-th">Promo</th>
                  <th className="admin-table-th">Disponibilidade</th>
                  <th className="admin-table-th">Status</th>
                  <th className="admin-table-th">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-off-white/40">
                    <td className="admin-table-td"><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                    <td className="admin-table-td">
                      <div className="flex items-center gap-3">
                        <img src={p.images[0]} alt="" className="w-10 h-10 object-cover bg-off-white" />
                        <span className="truncate max-w-[200px]">{p.name}</span>
                      </div>
                    </td>
                    <td className="admin-table-td text-muted text-xs">{p.sku}</td>
                    <td className="admin-table-td capitalize text-sm">{p.category}</td>
                    <td className="admin-table-td">
                      {editingPrice === p.id ? (
                        <input
                          autoFocus
                          value={priceValue}
                          onChange={(e) => setPriceValue(e.target.value)}
                          onBlur={() => saveInlinePrice(p)}
                          onKeyDown={(e) => e.key === 'Enter' && saveInlinePrice(p)}
                          className="w-24 px-2 py-1 border border-graphite text-sm"
                        />
                      ) : (
                        <button
                          onClick={() => { setEditingPrice(p.id); setPriceValue(String(p.price)) }}
                          className="hover:text-charcoal underline decoration-dotted underline-offset-2"
                        >
                          {formatPrice(p.price)}
                        </button>
                      )}
                    </td>
                    <td className="admin-table-td">{p.salePrice ? formatPrice(p.salePrice) : '—'}</td>
                    <td className="admin-table-td">
                      <div className="flex flex-col gap-1 items-start">
                        <AvailabilityBadge stock={p.stock} />
                        <button
                          type="button"
                          onClick={() => toggleAvailability(p)}
                          className="text-[10px] text-muted underline underline-offset-2 hover:text-graphite"
                        >
                          {p.stock > 0 ? 'Marcar esgotado' : 'Marcar disponível'}
                        </button>
                      </div>
                    </td>
                    <td className="admin-table-td"><StatusBadge status={p.status} /></td>
                    <td className="admin-table-td">
                      <div className="flex gap-1">
                        <Link to={`/admin/produtos/${p.id}`} className="p-2 hover:bg-off-white" title="Editar"><Pencil className="w-3.5 h-3.5" /></Link>
                        <button onClick={() => { duplicateProduct(p.id); showToast('Produto duplicado.'); refresh() }} className="p-2 hover:bg-off-white" title="Duplicar"><Copy className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { archiveProduct(p.id); showToast('Produto arquivado.'); refresh() }} className="p-2 hover:bg-off-white" title="Arquivar"><Archive className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setDeleteId(p.id)} className="p-2 hover:bg-off-white text-red-600" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="admin-card p-4">
                <div className="flex gap-3">
                  <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="mt-1" />
                  <img src={p.images[0]} alt="" className="w-16 h-16 object-cover bg-off-white shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light truncate">{p.name}</p>
                    <p className="text-xs text-muted">{p.sku}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="font-medium text-sm">{formatPrice(p.price)}</span>
                      <StatusBadge status={p.status} />
                      <AvailabilityBadge stock={p.stock} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                  <Link to={`/admin/produtos/${p.id}`} className="flex-1 admin-btn-secondary text-[10px] py-2 text-center">Editar</Link>
                  <button
                    type="button"
                    onClick={() => toggleAvailability(p)}
                    className="flex-1 admin-btn-secondary text-[10px] py-2"
                  >
                    {p.stock > 0 ? 'Esgotar' : 'Disponibilizar'}
                  </button>
                  <button onClick={() => setDeleteId(p.id)} className="p-2 border border-border text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId) { deleteProduct(deleteId); showToast('Produto excluído.'); refresh() } }}
        title="Excluir produto"
        message="Esta ação não pode ser desfeita. Deseja excluir este produto?"
        confirmLabel="Excluir"
        danger
      />

      <ConfirmDialog
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onConfirm={handleBulkDiscount}
        title="Aplicar desconto em massa"
        message={`Aplicar ${bulkDiscount}% de desconto em ${selected.length} produtos selecionados?`}
        extra={
          <label className="block mt-4">
            <span className="text-xs text-muted">Percentual de desconto</span>
            <input
              type="number"
              min={1}
              max={99}
              value={bulkDiscount}
              onChange={(e) => setBulkDiscount(e.target.value)}
              className="admin-input mt-1"
            />
          </label>
        }
      />
    </>
  )
}
