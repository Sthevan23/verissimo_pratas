import { Helmet } from 'react-helmet-async'
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { AnimateIn } from '../components/ui/AnimateIn'
import { categoryLabels } from '../data/categories'
import { products } from '../data/products'

const BRINCOS_TIPOS = [
  {
    slug: 'brincos',
    title: 'Unitários',
    description: 'Brincos avulsos para combinar do seu jeito',
  },
  {
    slug: 'brincos-duplas',
    title: 'Duplas',
    description: 'Pares prontos — dois furos',
  },
  {
    slug: 'brincos-trios',
    title: 'Trios',
    description: 'Conjuntos de três — múltiplos furos',
  },
] as const

function isTrioProduct(name: string) {
  return /trio/i.test(name)
}

function isDuplaProduct(name: string) {
  return /dupla/i.test(name)
}

export function Products() {
  const [searchParams] = useSearchParams()
  const category = searchParams.get('categoria')
  const query = searchParams.get('q')
  const isPromo = searchParams.get('promocao') === 'true'
  const isBrincosFamily =
    category === 'brincos' ||
    category === 'brincos-duplas' ||
    category === 'brincos-trios'

  const filtered = useMemo(() => {
    let result = [...products]
    if (category) {
      if (category === 'novidades') {
        result = result.filter((p) => p.isNew)
      } else if (category === 'brincos') {
        // Unitários: brincos que NÃO são dupla nem trio
        result = result.filter(
          (p) =>
            p.category === 'brincos' &&
            !isTrioProduct(p.name) &&
            !isDuplaProduct(p.name)
        )
      } else if (category === 'brincos-trios') {
        result = result.filter(
          (p) =>
            p.category === 'brincos-trios' ||
            (p.category === 'brincos' && isTrioProduct(p.name))
        )
      } else if (category === 'brincos-duplas') {
        result = result.filter(
          (p) =>
            p.category === 'brincos-duplas' ||
            (p.category === 'brincos' && isDuplaProduct(p.name))
        )
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
        : 'Produtos'

  return (
    <>
      <Helmet>
        <title>{title} — Verissimo Pratas 925</title>
        <meta
          name="description"
          content={`Explore ${title.toLowerCase()} em prata 925 na Verissimo Pratas. Garantia vitalícia e envio para todo o Brasil.`}
        />
      </Helmet>

      <div className="header-offset pb-16 sm:pb-20">
        <div className="container-brand">
          <AnimateIn className="text-center mb-10 lg:mb-12">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
              {isBrincosFamily ? 'Brincos' : `${filtered.length} ${filtered.length === 1 ? 'peça' : 'peças'}`}
            </p>
            <h1 className="heading-display text-3xl lg:text-5xl text-graphite">
              {title}
            </h1>
            {isBrincosFamily && (
              <p className="mt-3 text-sm text-warm-gray font-light max-w-md mx-auto">
                Escolha o formato certo para a quantidade de furos.
              </p>
            )}
          </AnimateIn>

          {/* Hub de tipos de brincos — estilo coleção com subopções */}
          {isBrincosFamily && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-12 lg:mb-16">
              {BRINCOS_TIPOS.map((tipo) => {
                const active = category === tipo.slug
                return (
                  <Link
                    key={tipo.slug}
                    to={`/produtos?categoria=${tipo.slug}`}
                    className={`group border px-5 py-6 text-center transition-colors ${
                      active
                        ? 'border-graphite bg-graphite text-cream'
                        : 'border-border bg-cream hover:border-graphite'
                    }`}
                  >
                    <span className="block text-[11px] tracking-[0.2em] uppercase mb-2">
                      {tipo.title}
                    </span>
                    <span
                      className={`block text-sm font-light ${
                        active ? 'text-cream/80' : 'text-warm-gray'
                      }`}
                    >
                      {tipo.description}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}

          {!isBrincosFamily && (
            <p className="text-center text-[11px] tracking-[0.3em] uppercase text-muted mb-10 -mt-6">
              {filtered.length} {filtered.length === 1 ? 'peça' : 'peças'}
            </p>
          )}

          {isBrincosFamily && (
            <p className="text-center text-[11px] tracking-[0.3em] uppercase text-muted mb-8">
              {filtered.length} {filtered.length === 1 ? 'peça' : 'peças'}
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="text-center text-warm-gray font-light py-20">
              Nenhum produto encontrado nesta opção.
              {isBrincosFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Unitários</strong>, <strong>Duplas</strong> ou{' '}
                  <strong>Trios</strong> no painel.
                </>
              )}
            </p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-6">
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
