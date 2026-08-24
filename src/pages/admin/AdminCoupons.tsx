import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus } from 'lucide-react'
import { PageHeader, Modal } from '../../components/admin/Modal'
import { getDatabase, saveDb } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import type { Coupon } from '../../types/admin'

export function AdminCoupons() {
  const { showToast } = useAdminToast()
  const [coupons, setCoupons] = useState(getDatabase().coupons)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ code: '', type: 'percentual' as const, value: '10', minPurchase: '100', usageLimit: '100', startsAt: '', expiresAt: '' })

  const save = () => {
    const db = getDatabase()
    const coupon: Coupon = {
      id: crypto.randomUUID(),
      code: form.code.toUpperCase(),
      type: form.type,
      value: parseFloat(form.value),
      minPurchase: parseFloat(form.minPurchase),
      usageLimit: parseInt(form.usageLimit),
      usageCount: 0,
      startsAt: form.startsAt || new Date().toISOString(),
      expiresAt: form.expiresAt,
      active: true,
    }
    db.coupons.push(coupon)
    saveDb(db)
    setCoupons(db.coupons)
    showToast('Cupom criado!')
    setModal(false)
  }

  return (
    <>
      <Helmet><title>Cupons — Verissimo Admin</title></Helmet>
      <PageHeader title="Cupons" subtitle={`${coupons.length} cupons`} action={<button onClick={() => setModal(true)} className="admin-btn-primary"><Plus className="w-4 h-4" /> Novo cupom</button>} />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {coupons.map((c) => (
          <div key={c.id} className="admin-card p-6">
            <p className="font-serif text-xl font-light tracking-wider">{c.code}</p>
            <p className="admin-num text-3xl mt-2">{c.type === 'percentual' ? `${c.value}% OFF` : `R$ ${c.value} OFF`}</p>
            <p className="text-xs text-muted mt-3">Mínimo: R$ {c.minPurchase} · Usos: {c.usageCount}/{c.usageLimit}</p>
            <p className="text-xs text-muted">Válido até {new Date(c.expiresAt).toLocaleDateString('pt-BR')}</p>
            <span className={`inline-block mt-3 text-[10px] uppercase px-2 py-1 border ${c.active ? 'text-emerald-700 border-emerald-200' : 'text-muted border-border'}`}>{c.active ? 'Ativo' : 'Inativo'}</span>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Novo cupom">
        <div className="space-y-4">
          <div><label className="admin-label">Código</label><input className="admin-input uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="VERISSIMO10" /></div>
          <div><label className="admin-label">Tipo</label><select className="admin-input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as 'percentual' })}><option value="percentual">Percentual</option><option value="valor_fixo">Valor fixo</option></select></div>
          <div><label className="admin-label">Valor</label><input type="number" className="admin-input" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
          <div><label className="admin-label">Compra mínima (R$)</label><input type="number" className="admin-input" value={form.minPurchase} onChange={(e) => setForm({ ...form, minPurchase: e.target.value })} /></div>
          <div><label className="admin-label">Limite de uso</label><input type="number" className="admin-input" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></div>
          <div><label className="admin-label">Data final</label><input type="date" className="admin-input" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
          <button onClick={save} className="admin-btn-primary w-full py-3">Criar cupom</button>
        </div>
      </Modal>
    </>
  )
}
