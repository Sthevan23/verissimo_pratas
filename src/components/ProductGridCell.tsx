import type { ReactNode } from 'react'

/** Envolve o card para o grid esticar pares na mesma linha (mobile 2 colunas). */
export function ProductGridCell({ children }: { children: ReactNode }) {
  return <div className="product-grid__cell">{children}</div>
}
