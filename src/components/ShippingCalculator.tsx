import { useState } from 'react'
import { Truck } from 'lucide-react'
import { formatPrice } from '../utils/format'
import {
  formatCep,
  onlyDigits,
  quoteShipping,
  type ShippingAddress,
  type ShippingOption,
} from '../services/shippingService'

type Props = {
  subtotal: number
  quantities: number[]
  selectedId?: string | null
  onSelect: (option: ShippingOption | null, meta: { cep: string; address: ShippingAddress | null }) => void
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

  const handleQuote = async () => {
    const digits = onlyDigits(cep)
    if (digits.length !== 8) {
      setError('Digite um CEP válido com 8 dígitos.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const result = await quoteShipping({
        cep: digits,
        subtotal,
        quantities: quantities.length ? quantities : [1],
      })
      setAddress(result.address)
      setOptions(result.options)
      if (result.options.length === 0) {
        onSelect(null, { cep: digits, address: result.address })
        setError(result.error || 'Nenhuma opção de frete para este CEP.')
      } else {
        const preferred =
          result.options.find((o) => o.id === selectedId) ?? result.options[0]
        onSelect(preferred, { cep: digits, address: result.address })
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
          className="flex-1 px-4 py-3 border border-border text-sm font-light bg-cream focus:outline-none focus:border-brand-green"
        />
        <button
          type="button"
          onClick={() => void handleQuote()}
          disabled={loading}
          className="px-4 py-3 border border-brand-green text-[10px] tracking-widest uppercase text-brand-green hover:bg-brand-green hover:text-white transition-colors disabled:opacity-50"
        >
          {loading ? '...' : 'Calcular'}
        </button>
      </div>

      {address && (
        <p className="text-[11px] text-muted font-light">
          {[address.localidade, address.uf].filter(Boolean).join(' — ')}
          {address.bairro ? ` · ${address.bairro}` : ''}
        </p>
      )}

      {error && <p className="text-[11px] text-red-700 font-light">{error}</p>}

      {options.length > 0 && (
        <ul className="space-y-2">
          {options.map((opt) => {
            const active = selectedId === opt.id
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => onSelect(opt, { cep: onlyDigits(cep), address })}
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
                        {opt.delivery_time
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
