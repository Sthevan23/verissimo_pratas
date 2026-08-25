import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Upload, X, GripVertical, Star } from 'lucide-react'
import { PageHeader } from '../../components/admin/Modal'
import { getAdminProduct, saveProduct } from '../../services/adminStore'
import { getDatabase } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { calcMargin, slugify } from '../../context/AdminToastContext'
import type { AdminProduct } from '../../types/admin'
import type { CategorySlug } from '../../types'

const emptyProduct = (): AdminProduct => ({
  id: crypto.randomUUID(),
  slug: '',
  sku: '',
  name: '',
  shortDescription: '',
  description: '',
  category: 'aneis',
  brand: 'Verissimo Pratas',
  price: 0,
  costPrice: 0,
  images: [],
  rating: 5,
  reviewCount: 0,
  stock: 0,
  minStock: 5,
  trackStock: true,
  inStock: true,
  material: 'Prata 925',
  silverType: 'Prata 925',
  warranty: 'Garantia vitalícia com certificado',
  care: '',
  shippingDays: 'Envio em até 24h úteis',
  seoTitle: '',
  seoDescription: '',
  status: 'active',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

export function AdminProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { showToast } = useAdminToast()
  const isNew = id === 'novo' || !id
  const [product, setProduct] = useState<AdminProduct>(emptyProduct)
  const categories = getDatabase().categories

  useEffect(() => {
    if (!isNew && id) {
      const p = getAdminProduct(id)
      if (p) setProduct(p)
    }
  }, [id, isNew])

  const margin = calcMargin(product.costPrice, product.salePrice ?? product.price)

  const update = (field: keyof AdminProduct, value: unknown) => {
    setProduct((p) => ({ ...p, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onload = () => {
        setProduct((p) => ({ ...p, images: [...p.images, reader.result as string] }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setProduct((p) => ({ ...p, images: p.images.filter((_, i) => i !== index) }))
  }

  const moveImage = (from: number, to: number) => {
    if (to < 0 || to >= product.images.length) return
    const imgs = [...product.images]
    const [item] = imgs.splice(from, 1)
    imgs.splice(to, 0, item)
    setProduct((p) => ({ ...p, images: imgs }))
  }

  const handleSave = (continueEditing = false) => {
    if (!product.name || !product.price) {
      showToast('Preencha nome e preço.', 'error')
      return
    }
    const slug = product.slug || slugify(product.name)
    const sku = product.sku || `VP-${Date.now().toString().slice(-6)}`
    const saved = saveProduct({
      ...product,
      slug,
      sku,
      seoTitle: product.seoTitle || `${product.name} | Verissimo Pratas 925`,
      inStock: product.stock > 0,
    })
    showToast(isNew ? 'Produto criado com sucesso!' : 'Produto atualizado!')
    if (continueEditing) {
      navigate(`/admin/produtos/${saved.id}`, { replace: true })
      setProduct(saved)
    } else {
      navigate('/admin/produtos')
    }
  }

  return (
    <>
      <Helmet><title>{isNew ? 'Novo produto' : 'Editar produto'} — Verissimo Admin</title></Helmet>
      <PageHeader title={isNew ? 'Novo produto' : 'Editar produto'} subtitle={product.name || 'Preencha os dados do produto'} />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <section className="admin-card p-6 space-y-4">
            <h2 className="font-serif text-lg font-light border-b border-border pb-3">Informações básicas</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="admin-label">Nome do produto</label>
                <input className="admin-input" value={product.name} onChange={(e) => update('name', e.target.value)} />
              </div>
              <div>
                <label className="admin-label">SKU</label>
                <input className="admin-input" value={product.sku} onChange={(e) => update('sku', e.target.value)} placeholder="VP-0001" />
              </div>
              <div>
                <label className="admin-label">Marca</label>
                <input className="admin-input" value={product.brand} onChange={(e) => update('brand', e.target.value)} />
              </div>
              <div>
                <label className="admin-label">Categoria</label>
                <select className="admin-input" value={product.category} onChange={(e) => update('category', e.target.value as CategorySlug)}>
                  {categories.map((c) => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="admin-label">Subcategoria</label>
                <input className="admin-input" value={product.subcategory ?? ''} onChange={(e) => update('subcategory', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label">Descrição curta</label>
                <textarea className="admin-input min-h-[80px]" value={product.shortDescription} onChange={(e) => update('shortDescription', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <label className="admin-label">Descrição completa</label>
                <textarea className="admin-input min-h-[120px]" value={product.description} onChange={(e) => update('description', e.target.value)} />
              </div>
            </div>
          </section>

          {/* Photos */}
          <section className="admin-card p-6 space-y-4">
            <h2 className="font-serif text-lg font-light border-b border-border pb-3">Fotos</h2>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-border p-8 cursor-pointer hover:border-silver-dark transition-colors">
              <Upload className="w-8 h-8 text-muted mb-2" strokeWidth={1.5} />
              <span className="text-sm text-muted font-light">Arraste ou clique para upload</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
            </label>
            {product.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {product.images.map((img, i) => (
                  <div key={i} className="relative group aspect-square bg-off-white border border-border">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 bg-graphite text-cream text-[9px] px-2 py-0.5 uppercase tracking-wider flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" /> Principal
                      </span>
                    )}
                    <div className="absolute inset-0 bg-graphite/0 group-hover:bg-graphite/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      {i > 0 && <button onClick={() => moveImage(i, 0)} className="p-1.5 bg-cream text-graphite text-[10px]">Principal</button>}
                      <button onClick={() => removeImage(i)} className="p-1.5 bg-red-900 text-cream"><X className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="absolute bottom-1 right-1 flex gap-0.5">
                      <button onClick={() => moveImage(i, i - 1)} className="p-1 bg-cream/80 text-graphite"><GripVertical className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* SEO */}
          <section className="admin-card p-6 space-y-4">
            <h2 className="font-serif text-lg font-light border-b border-border pb-3">SEO</h2>
            <div>
              <label className="admin-label">Título SEO</label>
              <input className="admin-input" value={product.seoTitle} onChange={(e) => update('seoTitle', e.target.value)} />
            </div>
            <div>
              <label className="admin-label">Meta description</label>
              <textarea className="admin-input min-h-[80px]" value={product.seoDescription} onChange={(e) => update('seoDescription', e.target.value)} maxLength={160} />
            </div>
            <div>
              <label className="admin-label">Slug</label>
              <input className="admin-input" value={product.slug} onChange={(e) => update('slug', e.target.value)} placeholder={slugify(product.name)} />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          {/* Prices */}
          <section className="admin-card p-6 space-y-4">
            <h2 className="font-serif text-lg font-light border-b border-border pb-3">Preços</h2>
            <div>
              <label className="admin-label">Preço de venda (R$)</label>
              <input type="number" step="0.01" className="admin-input" value={product.price || ''} onChange={(e) => update('price', parseFloat(e.target.value) || 0)} />
            </div>
            <div>
              <label className="admin-label">Preço promocional (R$)</label>
              <input type="number" step="0.01" className="admin-input" value={product.salePrice ?? ''} onChange={(e) => update('salePrice', e.target.value ? parseFloat(e.target.value) : undefined)} />
            </div>
            <div>
              <label className="admin-label">Preço de custo (R$)</label>
              <input type="number" step="0.01" className="admin-input" value={product.costPrice || ''} onChange={(e) => update('costPrice', parseFloat(e.target.value) || 0)} />
            </div>
            <div className="bg-off-white p-4 space-y-1 text-sm">
              <p className="text-muted">Margem de lucro</p>
              <p className="font-medium">R$ {margin.profit.toFixed(2)}</p>
              <p className="text-emerald-700">{margin.percent.toFixed(2)}%</p>
            </div>
          </section>

          {/* Stock */}
          <section className="admin-card p-6 space-y-4">
            <h2 className="font-serif text-lg font-light border-b border-border pb-3">Estoque</h2>
            <div>
              <label className="admin-label">Quantidade</label>
              <input type="number" className="admin-input" value={product.stock} onChange={(e) => update('stock', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="admin-label">Estoque mínimo</label>
              <input type="number" className="admin-input" value={product.minStock} onChange={(e) => update('minStock', parseInt(e.target.value) || 0)} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={product.trackStock} onChange={(e) => update('trackStock', e.target.checked)} className="accent-graphite" />
              <span className="text-sm font-light">Controlar estoque</span>
            </label>
          </section>

          {/* Additional */}
          <section className="admin-card p-6 space-y-4">
            <h2 className="font-serif text-lg font-light border-b border-border pb-3">Informações adicionais</h2>
            <div>
              <label className="admin-label">Tamanhos (separados por vírgula)</label>
              <input
                className="admin-input"
                value={(product.sizes ?? []).join(', ')}
                onChange={(e) => {
                  const sizes = e.target.value
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                  update('sizes', sizes.length ? sizes : undefined)
                }}
                placeholder="14, 16, 18, 20, 22"
              />
              <p className="text-[11px] text-muted mt-1">
                Anéis e pulseiras: informe os tamanhos disponíveis na loja.
              </p>
            </div>
            {(['material', 'silverType', 'weight', 'size', 'dimensions', 'warranty'] as const).map((field) => (
              <div key={field}>
                <label className="admin-label capitalize">{field === 'silverType' ? 'Tipo de prata' : field === 'weight' ? 'Peso' : field === 'size' ? 'Tamanho' : field === 'dimensions' ? 'Dimensões' : field === 'warranty' ? 'Garantia' : 'Material'}</label>
                <input className="admin-input" value={(product[field] as string) ?? ''} onChange={(e) => update(field, e.target.value)} />
              </div>
            ))}
            <div>
              <label className="admin-label">Status</label>
              <select className="admin-input" value={product.status} onChange={(e) => update('status', e.target.value)}>
                <option value="active">Ativo</option>
                <option value="draft">Rascunho</option>
                <option value="archived">Arquivado</option>
              </select>
            </div>
          </section>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={() => handleSave(false)} className="admin-btn-primary w-full py-3">Salvar produto</button>
            <button onClick={() => handleSave(true)} className="admin-btn-secondary w-full py-3">Salvar e continuar</button>
            <button onClick={() => navigate('/admin/produtos')} className="admin-btn-secondary w-full py-3 border-transparent text-muted">Cancelar</button>
          </div>
        </div>
      </div>
    </>
  )
}
