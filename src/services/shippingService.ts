export type ShippingOption = {
  id: string
  name: string
  company: string
  price: number
  delivery_time: number | null
  currency: string
  free?: boolean
}

export type ShippingAddress = {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export type ShippingQuoteResult = {
  ok: boolean
  cep: string
  address: ShippingAddress | null
  options: ShippingOption[]
  error: string | null
  configured: boolean
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '').slice(0, 8)
}

export function formatCep(value: string): string {
  const d = onlyDigits(value)
  if (d.length <= 5) return d
  return `${d.slice(0, 5)}-${d.slice(5)}`
}

export async function quoteShipping(params: {
  cep: string
  subtotal: number
  quantities: number[]
}): Promise<ShippingQuoteResult> {
  const cep = onlyDigits(params.cep)
  const res = await fetch('/api/shipping.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      cep,
      subtotal: params.subtotal,
      items: params.quantities.map((quantity) => ({ quantity })),
    }),
  })
  const data = await res.json()
  return {
    ok: Boolean(data.ok),
    cep: String(data.cep ?? cep),
    address: data.address ?? null,
    options: Array.isArray(data.options) ? data.options : [],
    error: data.error ?? (res.ok ? null : 'Não foi possível calcular o frete.'),
    configured: Boolean(data.configured),
  }
}
