import { Helmet } from 'react-helmet-async'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { AnimateIn } from '../components/ui/AnimateIn'
import { categoryLabels } from '../data/categories'
import { products } from '../data/products'

export function Products() {
  const [searchParams] = useSearchParams()
  const category = searchParams.get('categoria')
  const query = searchParams.get('q')
  const isPromo = searchParams.get('promocao') === 'true'

  const filtered = useMemo(() => {
    let result = [...products]
    if (category) {
      if (category === 'novidades') {
        result = result.filter((p) => p.isNew)
      } else {
        result = result.filter((p) => p.category === category)
      }
    }
    if (query) {
      const q = query.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.includes(q)
      )
    }
    if (isPromo) {
      result = result.filter((p) => p.isOnSale)
    }
    return result
  }, [category, query, isPromo])

  const title = category
    ? categoryLabels[category] ?? 'Produtos'
    : isPromo
      ? 'Ofertas especiais'
      : query
        ? `Busca: ${query}`
        : 'Coleções'

  return (
    <>
      <Helmet>
        <title>{title} — Verissimo Pratas 925</title>
        <meta
          name="description"
          content={`Explore ${title.toLowerCase()} em prata 925 na Verissimo Pratas. Garantia vitalícia e envio para todo o Brasil.`}
        />
      </Helmet>

      <div className="pt-28 lg:pt-32 pb-20">
        <div className="container-brand">
          <AnimateIn className="text-center mb-12 lg:mb-16">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
              {filtered.length} {filtered.length === 1 ? 'peça' : 'peças'}
            </p>
            <h1 className="heading-display text-3xl lg:text-5xl text-graphite">
              {title}
            </h1>
          </AnimateIn>

          {filtered.length === 0 ? (
            <p className="text-center text-warm-gray font-light py-20">
              Nenhum produto encontrado.
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6 lg:gap-y-12">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
