import { useState, useMemo, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Plus, Search, Copy, Archive, Trash2, Pencil, CloudUpload, Percent } from 'lucide-react'
import { PageHeader, ConfirmDialog, EmptyState, Modal } from '../../components/admin/Modal'
import { StatusBadge } from '../../components/admin/StatusBadge'
import {
  getAdminProducts,
  getDatabase,
  saveProduct,
  deleteProduct,
  archiveProduct,
  duplicateProduct,
  bulkUpdateProducts,
  hydrateCatalogFromServer,
  publishCatalogToServer,
  getUnpublishedProductIds,
  setStock,
} from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice } from '../../utils/format'
import type { AdminProduct } from '../../types/admin'

type DiscountScope = 'all' | 'category' | 'selected'

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

function applySalePrice(p: AdminProduct, pct: number): AdminProduct {
  const salePrice = Math.round(p.price * (1 - pct / 100) * 100) / 100
  return {
    ...p,
    salePrice,
    isOnSale: true,
    badge: p.badge === 'novidade' ? p.badge : 'promocao',
  }
}

function clearSalePrice(p: AdminProduct): AdminProduct {
  return {
    ...p,
    salePrice: undefined,
    isOnSale: false,
    badge: p.badge === 'promocao' ? undefined : p.badge,
  }
}

export function AdminProducts() {
  const { showToast } = useAdminToast()
  const [products, setProducts] = useState(getAdminProducts)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [discountPct, setDiscountPct] = useState('10')
  const [discountScope, setDiscountScope] = useState<DiscountScope>('all')
  const [discountCategory, setDiscountCategory] = useState('')
  const [editingPrice, setEditingPrice] = useState<string | null>(null)
  const [priceValue, setPriceValue] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const unpublishedCount = useMemo(() => getUnpublishedProductIds().length, [products])

  const categories = useMemo(() => {
    return getDatabase()
      .categories.filter((c) => c.active)
      .sort((a, b) => a.order - b.order)
  }, [products])

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
      showToast(`${p.name} marcado como esgotado.`)
    } else {
      setStock(p.id, 1, 'Marcado como disponível')
      showToast(`${p.name} disponível novamente.`)
    }
    refresh()
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    const list = q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q)
        )
      : [...products]
    // Esgotados no final da lista
    return list.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0))
  }, [products, search])

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
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

  const targetsForDiscount = (): AdminProduct[] => {
    if (discountScope === 'selected') {
      return products.filter((p) => selected.includes(p.id))
    }
    if (discountScope === 'category') {
      if (!discountCategory) return []
      return products.filter((p) => p.category === discountCategory && p.status === 'active')
    }
    return products.filter((p) => p.status === 'active')
  }

  const handleApplyDiscount = async () => {
    const pct = parseFloat(discountPct.replace(',', '.'))
    if (!pct || pct <= 0 || pct >= 100) {
      showToast('Informe um percentual entre 1 e 99.', 'error')
      return
    }
    if (discountScope === 'selected' && selected.length === 0) {
      showToast('Selecione pelo menos um produto na lista.', 'error')
      return
    }
    if (discountScope === 'category' && !discountCategory) {
      showToast('Escolha a categoria/seção.', 'error')
      return
    }
    const targets = targetsForDiscount()
    if (targets.length === 0) {
      showToast('Nenhum produto encontrado para aplicar o desconto.', 'error')
      return
    }
    setApplyingDiscount(true)
    targets.forEach((p) => saveProduct(applySalePrice(p, pct)))
    const pub = await publishCatalogToServer()
    setApplyingDiscount(false)
    setDiscountOpen(false)
    refresh()
    showToast(
      pub.ok
        ? `Desconto de ${pct}% aplicado em ${targets.length} produto(s) e publicado.`
        : `Desconto salvo aqui, mas falhou ao publicar no site.`,
      pub.ok ? 'success' : 'error'
    )
  }

  const handleClearDiscount = async () => {
    if (discountScope === 'selected' && selected.length === 0) {
      showToast('Selecione pelo menos um produto na lista.', 'error')
      return
    }
    if (discountScope === 'category' && !discountCategory) {
      showToast('Escolha a categoria/seção.', 'error')
      return
    }
    const targets = targetsForDiscount()
    if (targets.length === 0) {
      showToast('Nenhum produto para limpar.', 'error')
      return
    }
    setApplyingDiscount(true)
    targets.forEach((p) => saveProduct(clearSalePrice(p)))
    const pub = await publishCatalogToServer()
    setApplyingDiscount(false)
    setDiscountOpen(false)
    refresh()
    showToast(
      pub.ok
        ? `Promoção removida de ${targets.length} produto(s).`
        : `Removido aqui, mas falhou ao publicar.`,
      pub.ok ? 'success' : 'error'
    )
  }

  const scopeCount = targetsForDiscount().length

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
              onClick={() => setDiscountOpen(true)}
              className="admin-btn-secondary text-[10px]"
            >
              <Percent className="w-4 h-4" /> Descontos %
            </button>
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

      {unpublishedCount > 0 && (
        <div className="admin-card p-4 mb-4 border-amber-300 bg-amber-50 text-sm text-amber-950">
          <p className="font-medium mb-1">
            {unpublishedCount} produto{unpublishedCount > 1 ? 's' : ''} ainda não {unpublishedCount > 1 ? 'estão' : 'está'} no site
          </p>
          <p className="text-amber-900/90 mb-3">
            Cadastros feitos sem publicar ficam só neste navegador — por isso somem do painel em outro aparelho e a busca da loja não encontra.
            Clique em <strong>Publicar no site</strong> (logada no admin).
          </p>
          <button type="button" onClick={publishNow} disabled={syncing} className="admin-btn-primary text-[10px]">
            <CloudUpload className="w-4 h-4" /> Publicar agora
          </button>
        </div>
      )}

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
            <button
              onClick={() => {
                setDiscountScope('selected')
                setDiscountOpen(true)
              }}
              className="admin-btn-secondary text-[10px]"
            >
              Desconto nos selecionados ({selected.length})
            </button>
            <button
              onClick={() => {
                bulkUpdateProducts(selected, { status: 'archived' })
                showToast(`${selected.length} produtos arquivados.`)
                setSelected([])
                refresh()
              }}
              className="admin-btn-secondary text-[10px]"
            >
              Arquivar
            </button>
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhum produto encontrado"
          action={
            <Link to="/admin/produtos/novo" className="admin-btn-primary">
              Criar produto
            </Link>
          }
        />
      ) : (
        <>
          <div className="admin-card overflow-hidden hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="admin-table-th w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
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
                    <td className="admin-table-td">
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                      />
                    </td>
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
                          onClick={() => {
                            setEditingPrice(p.id)
                            setPriceValue(String(p.price))
                          }}
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
                    <td className="admin-table-td">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="admin-table-td">
                      <div className="flex gap-1">
                        <Link to={`/admin/produtos/${p.id}`} className="p-2 hover:bg-off-white" title="Editar">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => {
                            duplicateProduct(p.id)
                            showToast('Produto duplicado.')
                            refresh()
                          }}
                          className="p-2 hover:bg-off-white"
                          title="Duplicar"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            archiveProduct(p.id)
                            showToast('Produto arquivado.')
                            refresh()
                          }}
                          className="p-2 hover:bg-off-white"
                          title="Arquivar"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(p.id)}
                          className="p-2 hover:bg-off-white text-red-600"
                          title="Excluir"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {filtered.map((p) => (
              <div key={p.id} className="admin-card p-4">
                <div className="flex gap-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(p.id)}
                    onChange={() => toggleSelect(p.id)}
                    className="mt-1"
                  />
                  <img src={p.images[0]} alt="" className="w-16 h-16 object-cover bg-off-white shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-light truncate">{p.name}</p>
                    <p className="text-xs text-muted">{p.sku}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="font-medium text-sm">{formatPrice(p.price)}</span>
                      {p.salePrice ? (
                        <span className="text-xs text-emerald-700">Promo {formatPrice(p.salePrice)}</span>
                      ) : null}
                      <StatusBadge status={p.status} />
                      <AvailabilityBadge stock={p.stock} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/50">
                  <Link
                    to={`/admin/produtos/${p.id}`}
                    className="flex-1 admin-btn-secondary text-[10px] py-2 text-center"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => toggleAvailability(p)}
                    className="flex-1 admin-btn-secondary text-[10px] py-2"
                  >
                    {p.stock > 0 ? 'Esgotar' : 'Disponibilizar'}
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="p-2 border border-border text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            deleteProduct(deleteId)
            showToast('Produto excluído.')
            refresh()
          }
        }}
        title="Excluir produto"
        message="Esta ação não pode ser desfeita. Deseja excluir este produto?"
        confirmLabel="Excluir"
        danger
      />

      <Modal open={discountOpen} onClose={() => setDiscountOpen(false)} title="Descontos em %">
        <div className="space-y-4">
          <p className="text-sm text-warm-gray font-light">
            Escolha o percentual e onde aplicar: em todos os produtos, em uma seção (categoria) ou só
            nos produtos selecionados na lista.
          </p>

          <div>
            <label className="admin-label">Percentual de desconto (%)</label>
            <input
              type="number"
              min={1}
              max={99}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              className="admin-input"
              placeholder="Ex.: 15"
            />
          </div>

          <div>
            <label className="admin-label">Aplicar em</label>
            <div className="space-y-2">
              {(
                [
                  { id: 'all' as const, label: 'Todos os produtos ativos' },
                  { id: 'category' as const, label: 'Uma seção / categoria' },
                  {
                    id: 'selected' as const,
                    label: `Produtos selecionados (${selected.length})`,
                  },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.id}
                  className={`flex items-center gap-3 border px-3 py-3 cursor-pointer transition-colors ${
                    discountScope === opt.id
                      ? 'border-brand-green bg-brand-green/5'
                      : 'border-border hover:border-brand-green/40'
                  }`}
                >
                  <input
                    type="radio"
                    name="discount-scope"
                    checked={discountScope === opt.id}
                    onChange={() => setDiscountScope(opt.id)}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {discountScope === 'category' && (
            <div>
              <label className="admin-label">Seção / categoria</label>
              <select
                className="admin-input"
                value={discountCategory}
                onChange={(e) => setDiscountCategory(e.target.value)}
              >
                <option value="">Selecione…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <p className="text-xs text-muted">
            {scopeCount > 0
              ? `${scopeCount} produto(s) serão afetados.`
              : 'Nenhum produto no escopo escolhido.'}
          </p>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="button"
              disabled={applyingDiscount}
              onClick={() => void handleApplyDiscount()}
              className="admin-btn-primary flex-1 disabled:opacity-50"
            >
              {applyingDiscount ? 'Aplicando…' : 'Aplicar desconto'}
            </button>
            <button
              type="button"
              disabled={applyingDiscount}
              onClick={() => void handleClearDiscount()}
              className="admin-btn-secondary flex-1 disabled:opacity-50"
            >
              Remover promoções
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
