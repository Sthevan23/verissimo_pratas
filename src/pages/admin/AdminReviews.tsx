import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Star } from 'lucide-react'
import { PageHeader } from '../../components/admin/Modal'
import { StatusBadge } from '../../components/admin/StatusBadge'
import { getDatabase, saveDb } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'

export function AdminReviews() {
  const { showToast } = useAdminToast()
  const [reviews, setReviews] = useState(getDatabase().reviews)

  const updateStatus = (id: string, status: 'aprovada' | 'oculta' | 'pendente') => {
    const db = getDatabase()
    const r = db.reviews.find((x) => x.id === id)
    if (r) { r.status = status; saveDb(db); setReviews([...db.reviews]); showToast(`Avaliação ${status}.`) }
  }

  const deleteReview = (id: string) => {
    const db = getDatabase()
    db.reviews = db.reviews.filter((r) => r.id !== id)
    saveDb(db)
    setReviews(db.reviews)
    showToast('Avaliação excluída.')
  }

  return (
    <>
      <Helmet><title>Avaliações — Verissimo Admin</title></Helmet>
      <PageHeader title="Avaliações" subtitle={`${reviews.length} avaliações`} />

      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="admin-card p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-graphite text-graphite' : 'text-border'}`} />
                  ))}</div>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm font-light italic mb-2">"{r.comment}"</p>
                <p className="text-xs text-muted">{r.customerName} · {r.productName} · {new Date(r.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                {r.status !== 'aprovada' && <button onClick={() => updateStatus(r.id, 'aprovada')} className="admin-btn-secondary text-[10px] py-2">Aprovar</button>}
                {r.status !== 'oculta' && <button onClick={() => updateStatus(r.id, 'oculta')} className="admin-btn-secondary text-[10px] py-2">Ocultar</button>}
                <button onClick={() => deleteReview(r.id)} className="admin-btn-secondary text-[10px] py-2 text-red-600 border-red-200">Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
