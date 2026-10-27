import { Helmet } from 'react-helmet-async'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { AnimateIn } from '../components/ui/AnimateIn'
import { categoryLabels } from '../data/categories'
import { DEFAULT_RING_SIZES, resolveProductSizes } from '../data/sizes'
import { getStoreProducts } from '../services/storeService'
import type { Product } from '../types'
import {
  isPersonalizadosCategory,
  matchesStoreCategoryFilter,
} from '../utils/productCategory'

const BRINCOS_TIPOS = [
  {
    slug: 'brincos',
    title: 'Ver tudo',
    description: 'Todos os brincos em um só lugar',
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

const PULSEIRAS_TIPOS = [
  {
    slug: 'pulseiras',
    title: 'Ver tudo',
    description: 'Todas as pulseiras em um só lugar',
  },
  {
    slug: 'pulseiras-braceletes',
    title: 'Braceletes',
    description: 'Braceletes em prata 925',
  },
  {
    slug: 'pulseiras-infantil',
    title: 'Infantil',
    description: 'Peças delicadas para os pequenos',
  },
] as const

const BERLOQUES_TIPOS = [
  {
    slug: 'berloques',
    title: 'Ver tudo',
    description: 'Berloques e pulseiras para montar',
  },
  {
    slug: 'berloques-pulseiras',
    title: 'Pulseiras',
    description: 'Pulseiras para por berloques',
  },
] as const

const PERSONALIZADOS_TIPOS = [
  {
    slug: 'personalizados',
    title: 'Ver tudo',
    description: 'Toda a linha sob encomenda',
  },
  {
    slug: 'personalizados-aneis',
    title: 'Anéis',
    description: 'Anéis personalizados',
  },
  {
    slug: 'personalizados-colares',
    title: 'Colares',
    description: 'Colares personalizados',
  },
  {
    slug: 'personalizados-pulseiras',
    title: 'Pulseiras',
    description: 'Pulseiras personalizadas',
  },
  {
    slug: 'personalizados-berloques',
    title: 'Berloques',
    description: 'Berloques personalizados',
  },
  {
    slug: 'personalizados-chaveiros',
    title: 'Chaveiros',
    description: 'Chaveiros personalizados',
  },
  {
    slug: 'personalizados-pingentes',
    title: 'Pingentes',
    description: 'Pingentes personalizados',
  },
] as const

const MASCULINOS_TIPOS = [
  {
    slug: 'masculinos',
    title: 'Ver tudo',
    description: 'Toda a linha masculina',
  },
  {
    slug: 'masculinos-corrente',
    title: 'Corrente',
    description: 'Correntes masculinas',
  },
  {
    slug: 'masculinos-pulseira',
    title: 'Pulseira',
    description: 'Pulseiras masculinas',
  },
  {
    slug: 'masculinos-pingente',
    title: 'Pingente',
    description: 'Pingentes masculinos',
  },
] as const

/** Quantos cards montam de uma vez — evita centenas de fotos na primeira tela. */
const CATALOG_PAGE_SIZE = 24

function productHasSize(product: Product, size: string): boolean {
  const sizes = resolveProductSizes(product.category, product.sizes)
  if (!sizes?.length) return false
  const needle = size.trim()
  return sizes.some((s) => s.trim() === needle)
}

function collectAvailableSizes(products: Product[]): string[] {
  const set = new Set<string>()
  for (const p of products) {
    if (!p.inStock) continue
    const sizes = resolveProductSizes(p.category, p.sizes)
    sizes?.forEach((s) => {
      const t = s.trim()
      if (t) set.add(t)
    })
  }
  const list = [...set]
  list.sort((a, b) => {
    const na = Number(a)
    const nb = Number(b)
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb
    return a.localeCompare(b, 'pt-BR')
  })
  if (list.some((s) => DEFAULT_RING_SIZES.includes(s))) {
    const preferred = DEFAULT_RING_SIZES.filter((s) => set.has(s))
    const extras = list.filter((s) => !DEFAULT_RING_SIZES.includes(s))
    return [...preferred, ...extras]
  }
  return list
}

function filterCatalog(params: {
  category: string | null
  query: string | null
  isPromo: boolean
}): Product[] {
  let result = [...getStoreProducts()]
  const { category, query, isPromo } = params

  if (category) {
    result = result.filter((p) => matchesStoreCategoryFilter(p, category))
  }

  if (query) {
    const q = query.toLowerCase()
    result = result.filter(
      (p) => p.name.toLowerCase().includes(q) || p.category.includes(q)
    )
  }
  if (isPromo) {
    result = result.filter((p) => p.isOnSale)
  }
  return result
}

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category = searchParams.get('categoria')
  const query = searchParams.get('q')
  const isPromo = searchParams.get('promocao') === 'true'
  const sizeFilter = searchParams.get('tamanho')?.trim() || ''
  const isBrincosFamily =
    category === 'brincos' ||
    category === 'brincos-duplas' ||
    category === 'brincos-trios'
  const isPulseirasFamily =
    category === 'pulseiras' ||
    category === 'pulseiras-braceletes' ||
    category === 'pulseiras-infantil'
  const isBerloquesFamily =
    category === 'berloques' || category === 'berloques-pulseiras'
  const isPersonalizadosFamily = !!category && isPersonalizadosCategory(category)
  const isMasculinosFamily =
    !!category &&
    (category === 'masculinos' ||
      category === 'masculinos-corrente' ||
      category === 'masculinos-pulseira' ||
      category === 'masculinos-pingente' ||
      category === 'linha-masculina')

  const familyHub = isBrincosFamily
    ? { label: 'Brincos', tipos: BRINCOS_TIPOS, hint: 'Escolha o formato certo para a quantidade de furos.' }
    : isPulseirasFamily
      ? { label: 'Pulseiras', tipos: PULSEIRAS_TIPOS, hint: 'Escolha entre pulseiras, braceletes ou linha infantil.' }
      : isBerloquesFamily
        ? {
            label: 'Berloques',
            tipos: BERLOQUES_TIPOS,
            hint: 'Berloques avulsos ou pulseiras para montar do seu jeito.',
          }
        : isPersonalizadosFamily
          ? {
              label: 'Personalizados',
              tipos: PERSONALIZADOS_TIPOS,
              hint: 'Peças sob encomenda — personalize do seu jeito.',
            }
          : isMasculinosFamily
            ? {
                label: 'Masculinos',
                tipos: MASCULINOS_TIPOS,
                hint: 'Corrente, pulseira e pingente da linha masculina.',
              }
            : null

  const baseFiltered = useMemo(
    () => filterCatalog({ category, query, isPromo }),
    [category, query, isPromo]
  )

  const sizeOptions = useMemo(
    () => collectAvailableSizes(baseFiltered),
    [baseFiltered]
  )
  const showSizeFilter = sizeOptions.length > 0

  const filtered = useMemo(() => {
    if (!sizeFilter) return baseFiltered
    return baseFiltered.filter((p) => p.inStock && productHasSize(p, sizeFilter))
  }, [baseFiltered, sizeFilter])

  const [visibleCount, setVisibleCount] = useState(CATALOG_PAGE_SIZE)
  const filterKey = useMemo(
    () =>
      [
        category ?? '',
        query ?? '',
        isPromo ? '1' : '0',
        sizeFilter ?? '',
        filtered.length,
      ].join('|'),
    [category, query, isPromo, sizeFilter, filtered.length]
  )

  useEffect(() => {
    setVisibleCount(CATALOG_PAGE_SIZE)
  }, [filterKey])

  const visibleProducts = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  )
  const hasMore = visibleCount < filtered.length

  const setSizeFilter = (size: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (size) next.set('tamanho', size)
    else next.delete('tamanho')
    setSearchParams(next, { replace: true })
  }

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
              {familyHub
                ? familyHub.label
                : `${filtered.length} ${filtered.length === 1 ? 'peça' : 'peças'}`}
            </p>
            <h1 className="heading-display text-3xl lg:text-5xl text-graphite overflow-visible">
              {title}
            </h1>
            {familyHub && (
              <p className="mt-3 text-sm text-warm-gray font-light max-w-md mx-auto">
                {familyHub.hint}
              </p>
            )}
          </AnimateIn>

          {familyHub && (
            <div
              className={`grid gap-3 sm:gap-4 mb-12 lg:mb-16 ${
                familyHub.tipos.length > 3
                  ? 'grid-cols-2 lg:grid-cols-4'
                  : 'grid-cols-1 sm:grid-cols-3'
              }`}
            >
              {familyHub.tipos.map((tipo) => {
                const active = category === tipo.slug
                return (
                  <Link
                    key={tipo.slug}
                    to={`/produtos?categoria=${tipo.slug}`}
                    className={`group border px-5 py-6 text-center transition-colors ${
                      active
                        ? 'border-brand-green bg-brand-green text-white'
                        : 'border-border bg-cream hover:border-brand-green'
                    }`}
                  >
                    <span className="block text-[11px] tracking-[0.2em] uppercase mb-2">
                      {tipo.title}
                    </span>
                    <span
                      className={`block text-sm font-light ${
                        active ? 'text-white/80' : 'text-warm-gray'
                      }`}
                    >
                      {tipo.description}
                    </span>
                  </Link>
                )
              })}
            </div>
          )}

          {showSizeFilter && sizeOptions.length > 0 && (
            <div className="mb-10 lg:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-center gap-3 sm:gap-4">
              <label
                htmlFor="filtro-tamanho"
                className="text-[11px] tracking-[0.25em] uppercase text-muted text-center sm:text-left shrink-0"
              >
                Filtrar por tamanho
              </label>
              <div className="flex items-center justify-center gap-2">
                <select
                  id="filtro-tamanho"
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value || null)}
                  className="w-full sm:w-auto min-w-[11rem] appearance-none border border-border bg-cream px-4 py-2.5 pr-10 text-sm text-graphite focus:outline-none focus:border-brand-green bg-[length:12px] bg-[right_0.85rem_center] bg-no-repeat"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6B6B' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
                  }}
                >
                  <option value="">Todos os tamanhos</option>
                  {sizeOptions.map((size) => (
                    <option key={size} value={size}>
                      Tamanho {size}
                    </option>
                  ))}
                </select>
                {sizeFilter ? (
                  <button
                    type="button"
                    onClick={() => setSizeFilter(null)}
                    className="shrink-0 px-3 py-2.5 text-[11px] tracking-wider uppercase text-muted hover:text-graphite border border-border"
                  >
                    Limpar
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {!familyHub && (
            <p className="text-center text-[11px] tracking-[0.3em] uppercase text-muted mb-10 -mt-6">
              {filtered.length} {filtered.length === 1 ? 'peça' : 'peças'}
            </p>
          )}

          {familyHub && (
            <p className="text-center text-[11px] tracking-[0.3em] uppercase text-muted mb-8">
              {filtered.length} {filtered.length === 1 ? 'peça' : 'peças'}
            </p>
          )}

          {filtered.length === 0 ? (
            <p className="text-center text-warm-gray font-light py-20">
              {showSizeFilter && sizeFilter
                ? `Nenhuma peça disponível no tamanho ${sizeFilter} no momento.`
                : 'Nenhum produto encontrado nesta opção.'}
              {!sizeFilter && isBrincosFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Brincos</strong>, <strong>Duplas</strong> ou{' '}
                  <strong>Trios</strong> no painel.
                </>
              )}
              {!sizeFilter && isPulseirasFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Pulseiras</strong>, <strong>Braceletes</strong> ou{' '}
                  <strong>Infantil</strong> no painel.
                </>
              )}
              {!sizeFilter && isBerloquesFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Berloques</strong> ou{' '}
                  <strong>Pulseiras</strong> (para berloques) no painel.
                </>
              )}
              {!sizeFilter && isPersonalizadosFamily && (
                <>
                  {' '}
                  Cadastre peças de <strong>encomenda</strong> no painel
                  (Anéis, Colares, Pulseiras, Berloques ou Chaveiros).
                </>
              )}
              {!sizeFilter && isMasculinosFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Masculinos</strong> — Corrente,
                  Pulseira ou Pingente — no painel.
                </>
              )}
            </p>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-6">
                {visibleProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
              {hasMore && (
                <div className="mt-12 sm:mt-14 flex flex-col items-center gap-3">
                  <p className="text-[11px] tracking-[0.2em] uppercase text-muted">
                    Mostrando {visibleProducts.length} de {filtered.length}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCount((n) =>
                        Math.min(n + CATALOG_PAGE_SIZE, filtered.length)
                      )
                    }
                    className="min-h-11 px-8 py-3 border border-graphite text-graphite text-[11px] tracking-[0.2em] uppercase hover:bg-off-white transition-colors"
                  >
                    Carregar mais peças
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
