import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, GripVertical, CloudUpload, Loader2, ImageIcon } from 'lucide-react'
import { PageHeader, ConfirmDialog } from '../../components/admin/Modal'
import {
  getDatabase,
  saveCategory,
  deleteCategory,
  publishCatalogToServer,
} from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { compressImageFile, uploadProductFile } from '../../services/remoteCatalog'
import type { AdminCategory } from '../../types/admin'

const emptyCategory = (order: number): AdminCategory => ({
  id: crypto.randomUUID(),
  slug: '',
  name: '',
  image: '',
  description: '',
  order,
  active: true,
  showOnHome: true,
})

export function AdminCategories() {
  const { showToast } = useAdminToast()
  const [categories, setCategories] = useState(() =>
    getDatabase()
      .categories.sort((a, b) => a.order - b.order)
  )
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminCategory | null>(null)
  const [uploading, setUploading] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const refresh = () =>
    setCategories([...getDatabase().categories].sort((a, b) => a.order - b.order))

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !editing) return
    setUploading(true)
    try {
      const compressed = await compressImageFile(file)
      const url = await uploadProductFile(compressed)
      setEditing({ ...editing, image: url })
      showToast('Foto enviada!')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Falha no upload', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const save = async (cat: AdminCategory) => {
    if (!cat.name || !cat.slug) {
      showToast('Preencha nome e slug.', 'error')
      return
    }
    saveCategory(cat)
    refresh()
    setEditing(null)
    showToast('Categoria salva neste aparelho.')
  }

  const publishNow = async () => {
    setPublishing(true)
    const result = await publishCatalogToServer()
    setPublishing(false)
    showToast(
      result.ok ? 'Página inicial publicada no site!' : result.error || 'Falha ao publicar',
      result.ok ? 'success' : 'error'
    )
  }

  const remove = (id: string) => {
    deleteCategory(id)
    refresh()
    showToast('Categoria excluída.')
  }

  const homeCount = categories.filter((c) => c.active && c.showOnHome !== false).length

  return (
    <>
      <Helmet>
        <title>Página inicial — Categorias — Verissimo Admin</title>
      </Helmet>
      <PageHeader
        title="Página inicial — Categorias"
        subtitle={`${homeCount} categorias na home · edite fotos e nomes`}
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={publishNow}
              disabled={publishing}
              className="admin-btn-secondary text-[10px] disabled:opacity-50"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              Publicar no site
            </button>
            <button
              type="button"
              onClick={() => setEditing(emptyCategory(categories.length))}
              className="admin-btn-primary"
            >
              <Plus className="w-4 h-4" /> Nova categoria
            </button>
          </div>
        }
      />

      <div className="admin-card p-4 mb-4 text-sm text-muted">
        Aqui você edita o grid <strong className="text-graphite">Nossas categorias</strong> da
        página inicial (Anéis, Brincos, Colares…). Depois de salvar, clique em{' '}
        <strong className="text-graphite">Publicar no site</strong> para todos verem.
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="admin-card p-4 flex items-center gap-4">
            <GripVertical className="w-4 h-4 text-muted shrink-0" />
            <img
              src={cat.image || 'https://via.placeholder.com/48'}
              alt=""
              className="w-14 h-14 object-cover bg-off-white shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{cat.name || 'Sem nome'}</p>
                {cat.showOnHome !== false && cat.active && (
                  <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-emerald-200 text-emerald-700">
                    Na home
                  </span>
                )}
                {!cat.active && (
                  <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 border border-border text-muted">
                    Inativa
                  </span>
                )}
              </div>
              <p className="text-xs text-muted truncate">
                /produtos?categoria={cat.slug || '—'}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setEditing(cat)}
                className="admin-btn-secondary text-[10px] py-2"
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setDeleteId(cat.id)}
                className="admin-btn-secondary text-[10px] py-2 text-red-600"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-graphite/40 z-[150] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-cream w-full max-w-lg p-6 space-y-4 my-8">
            <h2 className="font-serif text-xl font-light">
              {editing.name ? 'Editar categoria' : 'Nova categoria'}
            </h2>

            <div>
              <label className="admin-label">Nome (aparece na home)</label>
              <input
                className="admin-input"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Slug (link da categoria)</label>
              <input
                className="admin-input"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                placeholder="aneis, brincos, colares..."
              />
            </div>
            <div>
              <label className="admin-label">Descrição</label>
              <textarea
                className="admin-input min-h-[60px]"
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </div>
            <div>
              <label className="admin-label">Ordem na home (0 = primeiro)</label>
              <input
                type="number"
                className="admin-input"
                value={editing.order}
                onChange={(e) =>
                  setEditing({ ...editing, order: parseInt(e.target.value, 10) || 0 })
                }
              />
            </div>

            <div>
              <label className="admin-label">Foto da categoria</label>
              {editing.image ? (
                <img
                  src={editing.image}
                  alt=""
                  className="w-full max-h-48 object-cover bg-off-white mb-2"
                />
              ) : null}
              <label
                className={`flex flex-col items-center justify-center border-2 border-dashed border-border p-6 cursor-pointer hover:border-silver-dark ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
              >
                {uploading ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted mb-2" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-muted mb-2" />
                )}
                <span className="text-xs text-muted">
                  {uploading ? 'Enviando…' : 'Escolher foto da galeria'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                  className="sr-only"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
              <input
                className="admin-input mt-2 text-xs"
                value={editing.image}
                onChange={(e) => setEditing({ ...editing, image: e.target.value })}
                placeholder="Ou cole URL da imagem"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.showOnHome !== false}
                onChange={(e) => setEditing({ ...editing, showOnHome: e.target.checked })}
                className="accent-graphite"
              />
              <span className="text-sm">Mostrar na página inicial</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="accent-graphite"
              />
              <span className="text-sm">Categoria ativa</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => save(editing)}
                className="admin-btn-primary flex-1 py-3"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="admin-btn-secondary flex-1 py-3"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && remove(deleteId)}
        title="Excluir categoria"
        message="Deseja excluir esta categoria da loja?"
        confirmLabel="Excluir"
        danger
      />
    </>
  )
}
