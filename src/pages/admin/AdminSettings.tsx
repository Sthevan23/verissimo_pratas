import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { ImageIcon, Loader2 } from 'lucide-react'
import { PageHeader } from '../../components/admin/Modal'
import { getDatabase, saveDb, publishCatalogToServer } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { compressImageFile, uploadProductFile } from '../../services/remoteCatalog'
import type { StoreSettings } from '../../types/admin'

export function AdminSettings() {
  const { showToast } = useAdminToast()
  const [settings, setSettings] = useState<StoreSettings>(getDatabase().settings)
  const [tab, setTab] = useState<'loja' | 'venda' | 'aparencia'>('loja')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    const db = getDatabase()
    db.settings = settings
    saveDb(db)
    const pub = await publishCatalogToServer()
    setSaving(false)
    showToast(
      pub.ok ? 'Configurações publicadas no site!' : 'Salvo aqui, mas falhou ao publicar no site.',
      pub.ok ? 'success' : 'error'
    )
  }

  const update = (field: keyof StoreSettings, value: string | number) => {
    setSettings((s) => ({ ...s, [field]: value }))
  }

  const handleHeroImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const compressed = await compressImageFile(file)
      const url = await uploadProductFile(compressed)
      setSettings((s) => ({ ...s, heroImage: url }))
      showToast('Foto do banner enviada!')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Falha no upload', 'error')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <>
      <Helmet>
        <title>Configurações — Verissimo Admin</title>
      </Helmet>
      <PageHeader
        title="Configurações"
        subtitle="Banner, textos e dados da loja"
        action={
          <button
            type="button"
            onClick={save}
            disabled={saving || uploading}
            className="admin-btn-primary disabled:opacity-50"
          >
            {saving ? 'Publicando…' : 'Salvar e publicar'}
          </button>
        }
      />

      <div className="flex gap-2 mb-6">
        {(['loja', 'venda', 'aparencia'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[11px] tracking-wider uppercase ${tab === t ? 'bg-graphite text-cream' : 'border border-border'}`}
          >
            {t === 'loja' ? 'Loja' : t === 'venda' ? 'Vendas' : 'Página inicial'}
          </button>
        ))}
      </div>

      <div className="admin-card p-6 max-w-2xl space-y-4">
        {tab === 'loja' && (
          <>
            {(
              [
                'storeName',
                'email',
                'phone',
                'whatsapp',
                'address',
                'instagram',
                'facebook',
                'tiktok',
              ] as const
            ).map((f) => (
              <div key={f}>
                <label className="admin-label capitalize">
                  {f === 'storeName'
                    ? 'Nome da loja'
                    : f === 'whatsapp'
                      ? 'WhatsApp'
                      : f}
                </label>
                <input
                  className="admin-input"
                  value={String(settings[f])}
                  onChange={(e) => update(f, e.target.value)}
                />
              </div>
            ))}
          </>
        )}
        {tab === 'venda' && (
          <>
            <div>
              <label className="admin-label">Frete grátis acima de (R$)</label>
              <input
                type="number"
                className="admin-input"
                value={settings.freeShippingMin}
                onChange={(e) => update('freeShippingMin', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="admin-label">Pedido mínimo (R$)</label>
              <input
                type="number"
                className="admin-input"
                value={settings.minOrder}
                onChange={(e) => update('minOrder', parseFloat(e.target.value))}
              />
            </div>
            <div>
              <label className="admin-label">Parcelas máximas</label>
              <input
                type="number"
                className="admin-input"
                value={settings.maxInstallments}
                onChange={(e) => update('maxInstallments', parseInt(e.target.value, 10))}
              />
            </div>
          </>
        )}
        {tab === 'aparencia' && (
          <>
            <div>
              <label className="admin-label">Foto do banner (topo da home)</label>
              {settings.heroImage ? (
                <img
                  src={settings.heroImage}
                  alt=""
                  className="w-full max-h-40 object-cover bg-off-white mb-2"
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
                <span className="text-xs text-muted">Escolher foto do banner</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                  className="sr-only"
                  onChange={handleHeroImage}
                  disabled={uploading}
                />
              </label>
            </div>
            <div>
              <label className="admin-label">Título do banner</label>
              <input
                className="admin-input"
                value={settings.heroTitle}
                onChange={(e) => update('heroTitle', e.target.value)}
              />
            </div>
            <div>
              <label className="admin-label">Subtítulo do banner</label>
              <textarea
                className="admin-input min-h-[80px]"
                value={settings.heroSubtitle}
                onChange={(e) => update('heroSubtitle', e.target.value)}
              />
            </div>
            <p className="text-xs text-muted">
              Para editar o grid de categorias (Anéis, Brincos…), vá em{' '}
              <strong>Categorias</strong> no menu.
            </p>
          </>
        )}
      </div>
    </>
  )
}

export function AdminUsers() {
  const users = getDatabase().adminUsers

  return (
    <>
      <Helmet>
        <title>Usuários — Verissimo Admin</title>
      </Helmet>
      <PageHeader title="Usuários administrativos" subtitle="Gerencie acessos e permissões" />

      <div className="admin-card overflow-hidden">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr>
              <th className="admin-table-th">Nome</th>
              <th className="admin-table-th">Email</th>
              <th className="admin-table-th">Função</th>
              <th className="admin-table-th">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="admin-table-td">{u.name}</td>
                <td className="admin-table-td text-muted">{u.email}</td>
                <td className="admin-table-td capitalize">{u.role}</td>
                <td className="admin-table-td">
                  <span
                    className={`text-[10px] uppercase px-2 py-1 border ${u.active ? 'text-emerald-700 border-emerald-200' : 'text-muted border-border'}`}
                  >
                    {u.active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="admin-card p-6 mt-6 max-w-2xl">
        <h3 className="font-serif text-lg font-light mb-4">Permissões por função</h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong className="capitalize">Administrador:</strong> Acesso total ao sistema.
          </div>
          <div>
            <strong className="capitalize">Gerente:</strong> Produtos, pedidos, estoque,
            financeiro, clientes, cupons, avaliações e relatórios.
          </div>
          <div>
            <strong className="capitalize">Editor:</strong> Produtos, categorias e avaliações.
          </div>
        </div>
      </div>

      <div className="admin-card p-6 mt-6">
        <h3 className="font-serif text-lg font-light mb-4">Auditoria recente</h3>
        {getDatabase().auditLog.slice(0, 10).map((a) => (
          <div key={a.id} className="py-2 border-b border-border/50 text-sm">
            <span className="text-muted">{new Date(a.createdAt).toLocaleString('pt-BR')}</span>
            <span className="mx-2">·</span>
            <strong>{a.adminName}</strong> — {a.details}
          </div>
        ))}
      </div>
    </>
  )
}
