const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pagamento_pendente: { label: 'Pagamento pendente', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  pago: { label: 'Pago', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  em_preparacao: { label: 'Em preparação', className: 'bg-blue-50 text-blue-800 border-blue-200' },
  enviado: { label: 'Enviado', className: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  entregue: { label: 'Entregue', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  cancelado: { label: 'Cancelado', className: 'bg-red-50 text-red-700 border-red-200' },
  em_estoque: { label: 'Em estoque', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  estoque_baixo: { label: 'Estoque baixo', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  esgotado: { label: 'Esgotado', className: 'bg-red-50 text-red-700 border-red-200' },
  active: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  draft: { label: 'Rascunho', className: 'bg-gray-50 text-gray-600 border-gray-200' },
  archived: { label: 'Arquivado', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  pendente: { label: 'Pendente', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  aprovada: { label: 'Aprovada', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  oculta: { label: 'Oculta', className: 'bg-gray-50 text-gray-500 border-gray-200' },
  atrasado: { label: 'Atrasado', className: 'bg-red-50 text-red-700 border-red-200' },
  recebido: { label: 'Recebido', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] ?? { label: status, className: 'bg-off-white text-warm-gray border-border' }
  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] tracking-wider uppercase border ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

export const ORDER_STATUS_OPTIONS = [
  { value: 'pagamento_pendente', label: 'Pagamento pendente' },
  { value: 'pago', label: 'Pago' },
  { value: 'em_preparacao', label: 'Em preparação' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregue', label: 'Entregue' },
  { value: 'cancelado', label: 'Cancelado' },
]
