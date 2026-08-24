import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus, GripVertical } from 'lucide-react'
import { PageHeader, ConfirmDialog } from '../../components/admin/Modal'
import { getDatabase, saveDb } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import type { AdminCategory } from '../../types/admin'

export function AdminCategories() {
  const { showToast } = useAdminToast()
  const [categories, setCategories] = useState(getDatabase().categories.sort((a, b) => a.order - b.order))
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editing, setEditing] = useState<AdminCategory | null>(null)

  const save = (cat: AdminCategory) => {
    const db = getDatabase()
    const idx = db.categories.findIndex((c) => c.id === cat.id)
    if (idx >= 0) db.categories[idx] = cat
    else db.categories.push(cat)
    saveDb(db)
    setCategories([...db.categories].sort((a, b) => a.order - b.order))
    setEditing(null)
    showToast('Categoria salva!')
  }

  const remove = (id: string) => {
    const db = getDatabase()
    db.categories = db.categories.filter((c) => c.id !== id)
    saveDb(db)
    setCategories(db.categories)
    showToast('Categoria excluída.')
  }

  return (
    <>
      <Helmet><title>Categorias — Verissimo Admin</title></Helmet>
      <PageHeader
        title="Categorias"
        subtitle={`${categories.length} categorias`}
        action={
          <button onClick={() => setEditing({ id: crypto.randomUUID(), slug: '', name: '', image: '', description: '', order: categories.length, active: true })} className="admin-btn-primary">
            <Plus className="w-4 h-4" /> Nova categoria
          </button>
        }
      />

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="admin-card p-4 flex items-center gap-4">
            <GripVertical className="w-4 h-4 text-muted shrink-0" />
            <img src={cat.image || 'https://via.placeholder.com/48'} alt="" className="w-12 h-12 object-cover bg-off-white shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{cat.name}</p>
              <p className="text-xs text-muted truncate">{cat.description}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => setEditing(cat)} className="admin-btn-secondary text-[10px] py-2">Editar</button>
              <button onClick={() => setDeleteId(cat.id)} className="admin-btn-secondary text-[10px] py-2 text-red-600">Excluir</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-graphite/40 z-[150] flex items-center justify-center p-4">
          <div className="bg-cream w-full max-w-lg p-6 space-y-4">
            <h2 className="font-serif text-xl font-light">{editing.name ? 'Editar' : 'Nova'} categoria</h2>
            <div><label className="admin-label">Nome</label><input className="admin-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div><label className="admin-label">Slug</label><input className="admin-input" value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} /></div>
            <div><label className="admin-label">Descrição</label><textarea className="admin-input" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div><label className="admin-label">URL da imagem</label><input className="admin-input" value={editing.image} onChange={(e) => setEditing({ ...editing, image: e.target.value })} /></div>
            <div className="flex gap-2">
              <button onClick={() => save(editing)} className="admin-btn-primary flex-1 py-3">Salvar</button>
              <button onClick={() => setEditing(null)} className="admin-btn-secondary flex-1 py-3">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteId && remove(deleteId)} title="Excluir categoria" message="Deseja excluir esta categoria?" confirmLabel="Excluir" danger />
    </>
  )
}
