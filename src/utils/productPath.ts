/** Link único do produto (usa id para não abrir outro com o mesmo nome/slug). */
export function productPath(product: { id: string; slug?: string }): string {
  return `/produto/${encodeURIComponent(product.id)}`
}
