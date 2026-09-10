import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Truck } from 'lucide-react'
import { formatPrice } from '../utils/format'
import {
  formatCep,
  onlyDigits,
  quoteShipping,
  type ShippingAddress,
  type ShippingOption,
} from '../services/shippingService'

export type ShippingMeta = {
  cep: string
  address: ShippingAddress | null
}

type Props = {
  subtotal: number
  quantities: number[]
  selectedId?: string | null
  onSelect: (option: ShippingOption | null, meta: ShippingMeta) => void
  compact?: boolean
}

export function ShippingCalculator({
  subtotal,
  quantities,
  selectedId,
  onSelect,
  compact = false,
}: Props) {
  const [cep, setCep] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<ShippingAddress | null>(null)
  const [options, setOptions] = useState<ShippingOption[]>([])

  const meta = (addr: ShippingAddress | null = address): ShippingMeta => ({
    cep: onlyDigits(cep),
    address: addr,
  })

  const handleQuote = async () => {
    const digits = onlyDigits(cep)
    if (digits.length !== 8) {
      setError('Digite um CEP válido com 8 dígitos.')
      return
    }
    setLoading(true)
    setError(null)
    setOptions([])
    setAddress(null)
    onSelect(null, { cep: digits, address: null })
    try {
      const result = await quoteShipping({
        cep: digits,
        subtotal,
        quantities: quantities.length ? quantities : [1],
      })
      setAddress(result.address)
      setOptions(result.options)
      const nextMeta: ShippingMeta = {
        cep: digits,
        address: result.address,
      }
      if (result.options.length === 0) {
        onSelect(null, nextMeta)
        setError(result.error || 'Nenhuma opção de frete para este CEP.')
      } else {
        const preferred =
          result.options.find((o) => o.id === selectedId) ?? result.options[0]
        onSelect(preferred, nextMeta)
        if (result.error && !result.configured) {
          setError(result.error)
        } else {
          setError(null)
        }
      }
    } catch {
      setError('Erro ao calcular frete. Tente novamente.')
      setOptions([])
      onSelect(null, { cep: digits, address: null })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className="flex items-center gap-2 text-sm text-graphite">
        <Truck className="w-4 h-4 text-brand-green shrink-0" strokeWidth={1.75} />
        <span className="font-medium">Calcular frete (SuperFrete / Correios)</span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          value={formatCep(cep)}
          onChange={(e) => setCep(onlyDigits(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              void handleQuote()
            }
          }}
          placeholder="CEP"
          aria-label="CEP"
          disabled={loading}
          className="flex-1 px-4 py-3 border border-border text-sm font-light bg-cream focus:outline-none focus:border-brand-green disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void handleQuote()}
          disabled={loading}
          className="min-w-[7.5rem] px-4 py-3 border border-brand-green text-[10px] tracking-widest uppercase text-brand-green hover:bg-brand-green hover:text-white transition-colors disabled:opacity-70 disabled:hover:bg-transparent disabled:hover:text-brand-green inline-flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
              Buscando
            </>
          ) : (
            'Calcular'
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="shipping-loading"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
            className="rounded-sm border border-brand-green/25 bg-brand-green/5 px-4 py-4"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="shrink-0"
              >
                <Truck className="w-5 h-5 text-brand-green" strokeWidth={1.75} />
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-graphite font-light">Consultando frete…</p>
                <p className="text-[11px] text-muted mt-0.5">Buscando opções na SuperFrete</p>
                <div className="mt-3 h-1 overflow-hidden rounded-full bg-border/70">
                  <motion.div
                    className="h-full w-1/3 rounded-full bg-brand-green"
                    animate={{ x: ['-10%', '220%'] }}
                    transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
              </div>
              <Loader2 className="w-4 h-4 text-brand-green animate-spin shrink-0" strokeWidth={2} />
            </div>
            <div className="mt-3 space-y-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="h-10 rounded-sm bg-cream/80 border border-border/60"
                  animate={{ opacity: [0.45, 0.9, 0.45] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!loading && address && (
        <p className="text-[11px] text-muted font-light">
          {[address.logradouro, address.bairro].filter(Boolean).join(' · ')}
          {(address.logradouro || address.bairro) && ' — '}
          {[address.localidade, address.uf].filter(Boolean).join('/')}
        </p>
      )}

      {!loading && error && <p className="text-[11px] text-red-700 font-light">{error}</p>}

      {!loading && options.length > 0 && (
        <ul className="space-y-2">
          {options.map((opt) => {
            const active = selectedId === opt.id
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => onSelect(opt, meta())}
                  className={`w-full text-left px-3 py-3 border transition-colors ${
                    active
                      ? 'border-brand-green bg-brand-green/5'
                      : 'border-border hover:border-brand-green/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-graphite">{opt.name}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {opt.company}
                        {opt.id === 'retirada-loja'
                          ? ' · Combinar retirada'
                          : opt.delivery_time
                            ? ` · ${opt.delivery_time} dia${opt.delivery_time > 1 ? 's' : ''} úteis`
                            : ''}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-graphite shrink-0">
                      {opt.price <= 0 ? 'Grátis' : formatPrice(opt.price)}
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
