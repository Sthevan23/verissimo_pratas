import { useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Plus } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { PageHeader, Modal } from '../../components/admin/Modal'
import { StatCard } from '../../components/admin/StatCard'
import { getDashboardStats, getDatabase, saveDb } from '../../services/adminStore'
import { useAdminToast } from '../../context/AdminToastContext'
import { formatPrice } from '../../utils/format'
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import type { FinancialTransaction, Payable, Receivable } from '../../types/admin'

const TX_CATEGORIES = ['Vendas', 'Publicidade', 'Frete', 'Fornecedores', 'Embalagens', 'Taxas', 'Funcionários', 'Aluguel', 'Outros']

export function AdminFinance() {
  const { showToast } = useAdminToast()
  const [tab, setTab] = useState<'overview' | 'fluxo' | 'pagar' | 'receber'>('overview')
  const [modal, setModal] = useState<'entrada' | 'saida' | null>(null)
  const [form, setForm] = useState({ description: '', category: 'Vendas', amount: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Pix', notes: '' })
  const stats = useMemo(() => getDashboardStats(), [])
  const db = useMemo(() => getDatabase(), [])

  const chartData = useMemo(() => {
    const entries = db.transactions.filter((t) => t.type === 'entrada').reduce((s, t) => s + t.amount, 0)
    const exits = db.transactions.filter((t) => t.type === 'saida').reduce((s, t) => s + t.amount, 0)
    return [{ name: 'Fluxo', entradas: entries, saidas: exits, saldo: entries - exits }]
  }, [db.transactions])

  const saveTransaction = () => {
    const amount = parseFloat(form.amount)
    if (!form.description || !amount) return
    const tx: FinancialTransaction = {
      id: crypto.randomUUID(),
      description: form.description,
      category: form.category,
      type: modal!,
      amount,
      date: form.date,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      status: 'confirmado',
      createdAt: new Date().toISOString(),
    }
    const updated = getDatabase()
    updated.transactions.unshift(tx)
    saveDb(updated)
    showToast(`${modal === 'entrada' ? 'Entrada' : 'Saída'} registrada.`)
    setModal(null)
    setForm({ description: '', category: 'Vendas', amount: '', date: new Date().toISOString().split('T')[0], paymentMethod: 'Pix', notes: '' })
  }

  return (
    <>
      <Helmet><title>Financeiro — Verissimo Admin</title></Helmet>
      <PageHeader
        title="Financeiro"
        subtitle="Gestão financeira completa"
        action={
          <div className="flex gap-2">
            <button onClick={() => setModal('entrada')} className="admin-btn-primary text-[10px]"><Plus className="w-3.5 h-3.5" /> Entrada</button>
            <button onClick={() => setModal('saida')} className="admin-btn-secondary text-[10px]"><Plus className="w-3.5 h-3.5" /> Saída</button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard label="Faturamento bruto" value={stats.grossRevenue} icon={DollarSign} prefix="R$" />
        <StatCard label="Faturamento líquido" value={stats.netRevenue} icon={TrendingUp} prefix="R$" />
        <StatCard label="Custos" value={stats.costs} icon={TrendingDown} prefix="R$" />
        <StatCard label="Lucro" value={stats.profit} icon={Wallet} prefix="R$" />
        <StatCard label="Despesas" value={stats.expenses} icon={TrendingDown} prefix="R$" />
        <StatCard label="Ticket médio" value={stats.avgTicket} icon={DollarSign} prefix="R$" />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['overview', 'fluxo', 'pagar', 'receber'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-[11px] tracking-wider uppercase ${tab === t ? 'bg-graphite text-cream' : 'border border-border text-warm-gray'}`}>
            {t === 'overview' ? 'Visão geral' : t === 'fluxo' ? 'Fluxo de caixa' : t === 'pagar' ? 'Contas a pagar' : 'Contas a receber'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="admin-card p-6 mb-6">
          <h3 className="font-serif text-lg font-light mb-4">Lucro real</h3>
          <div className="space-y-3 text-sm max-w-md">
            <div className="flex justify-between"><span>Faturamento</span><span>{formatPrice(stats.grossRevenue)}</span></div>
            <div className="flex justify-between text-red-700"><span>− Custos produtos</span><span>-{formatPrice(stats.costs)}</span></div>
            <div className="flex justify-between text-red-700"><span>− Despesas</span><span>-{formatPrice(stats.expenses)}</span></div>
            <div className="flex justify-between font-medium text-base pt-3 border-t border-border text-emerald-700"><span>= Lucro líquido</span><span>{formatPrice(stats.profit)}</span></div>
          </div>
        </div>
      )}

      {tab === 'fluxo' && (
        <>
          <div className="admin-card p-6 mb-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E3DF" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatPrice(Number(v))} />
                <Legend />
                <Bar dataKey="entradas" fill="#1A1A1A" name="Entradas" />
                <Bar dataKey="saidas" fill="#9A9A9A" name="Saídas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <TransactionsTable transactions={db.transactions} />
        </>
      )}

      {tab === 'pagar' && <PayablesTable payables={db.payables} />}
      {tab === 'receber' && <ReceivablesTable receivables={db.receivables} />}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === 'entrada' ? 'Nova entrada' : 'Nova saída'}>
        <div className="space-y-4">
          <div><label className="admin-label">Descrição</label><input className="admin-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="admin-label">Categoria</label><select className="admin-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{TX_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="admin-label">Valor (R$)</label><input type="number" className="admin-input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><label className="admin-label">Data</label><input type="date" className="admin-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
          <div><label className="admin-label">Forma de pagamento</label><input className="admin-input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })} /></div>
          <div><label className="admin-label">Observação</label><textarea className="admin-input" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          <button onClick={saveTransaction} className="admin-btn-primary w-full py-3">Salvar</button>
        </div>
      </Modal>
    </>
  )
}

function TransactionsTable({ transactions }: { transactions: FinancialTransaction[] }) {
  return (
    <div className="admin-card overflow-hidden">
      <table className="w-full min-w-[600px]">
        <thead><tr><th className="admin-table-th">Data</th><th className="admin-table-th">Descrição</th><th className="admin-table-th">Categoria</th><th className="admin-table-th">Tipo</th><th className="admin-table-th">Valor</th></tr></thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id}><td className="admin-table-td">{new Date(t.date).toLocaleDateString('pt-BR')}</td><td className="admin-table-td">{t.description}</td><td className="admin-table-td">{t.category}</td><td className="admin-table-td capitalize">{t.type}</td><td className={`admin-table-td font-medium ${t.type === 'entrada' ? 'text-emerald-700' : 'text-red-700'}`}>{formatPrice(t.amount)}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function PayablesTable({ payables }: { payables: Payable[] }) {
  return (
    <div className="admin-card overflow-hidden">
      <table className="w-full min-w-[600px]">
        <thead><tr><th className="admin-table-th">Descrição</th><th className="admin-table-th">Fornecedor</th><th className="admin-table-th">Valor</th><th className="admin-table-th">Vencimento</th><th className="admin-table-th">Status</th></tr></thead>
        <tbody>
          {payables.map((p) => (
            <tr key={p.id}><td className="admin-table-td">{p.description}</td><td className="admin-table-td">{p.supplier}</td><td className="admin-table-td">{formatPrice(p.amount)}</td><td className="admin-table-td">{new Date(p.dueDate).toLocaleDateString('pt-BR')}</td><td className="admin-table-td"><span className={`text-[10px] uppercase px-2 py-1 border ${p.status === 'atrasado' ? 'text-red-700 border-red-200' : 'text-amber-700 border-amber-200'}`}>{p.status}</span></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ReceivablesTable({ receivables }: { receivables: Receivable[] }) {
  return (
    <div className="admin-card overflow-hidden">
      <table className="w-full min-w-[600px]">
        <thead><tr><th className="admin-table-th">Cliente</th><th className="admin-table-th">Pedido</th><th className="admin-table-th">Valor</th><th className="admin-table-th">Vencimento</th><th className="admin-table-th">Status</th></tr></thead>
        <tbody>
          {receivables.map((r) => (
            <tr key={r.id}><td className="admin-table-td">{r.customerName}</td><td className="admin-table-td">{r.orderId.slice(0, 8)}</td><td className="admin-table-td">{formatPrice(r.amount)}</td><td className="admin-table-td">{new Date(r.dueDate).toLocaleDateString('pt-BR')}</td><td className="admin-table-td capitalize">{r.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
