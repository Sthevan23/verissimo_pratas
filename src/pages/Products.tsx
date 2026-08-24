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

function isTrioProduct(name: string) {
  return /trio/i.test(name)
}

function isDuplaProduct(name: string) {
  return /dupla/i.test(name)
}

function isBraceleteProduct(name: string) {
  return /bracelet/i.test(name)
}

function isInfantilProduct(name: string) {
  return /infantil|crian[cç]a|baby|kids/i.test(name)
}

function isPulseiraBerloqueProduct(name: string, description?: string) {
  const text = `${name} ${description ?? ''}`
  return /pulseira.*berloque|berloque.*pulseira|para berloques|pulseira de berloques/i.test(
    text
  )
}

function isBrincosCategory(cat: string) {
  return cat === 'brincos' || cat === 'brincos-duplas' || cat === 'brincos-trios'
}

function isPulseirasCategory(cat: string) {
  return (
    cat === 'pulseiras' ||
    cat === 'pulseiras-braceletes' ||
    cat === 'pulseiras-infantil'
  )
}

function isBerloquesCategory(cat: string) {
  return cat === 'berloques' || cat === 'berloques-pulseiras'
}

function isPersonalizadosCategory(cat: string) {
  return cat === 'personalizados' || cat.startsWith('personalizados-')
}

function isMasculinosCategory(cat: string) {
  return (
    cat === 'masculinos' ||
    cat.startsWith('masculinos-') ||
    cat === 'linha-masculina'
  )
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

  const filtered = useMemo(() => {
    let result = [...products]
    if (category) {
      if (category === 'novidades') {
        result = result.filter((p) => p.isNew)
      } else if (category === 'brincos') {
        result = result.filter(
          (p) =>
            isBrincosCategory(p.category) ||
            isTrioProduct(p.name) ||
            isDuplaProduct(p.name)
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
      } else if (category === 'pulseiras') {
        result = result.filter(
          (p) =>
            isPulseirasCategory(p.category) ||
            isBraceleteProduct(p.name) ||
            isInfantilProduct(p.name)
        )
      } else if (category === 'pulseiras-braceletes') {
        result = result.filter(
          (p) =>
            p.category === 'pulseiras-braceletes' ||
            (p.category === 'pulseiras' && isBraceleteProduct(p.name))
        )
      } else if (category === 'pulseiras-infantil') {
        result = result.filter(
          (p) =>
            p.category === 'pulseiras-infantil' ||
            (p.category === 'pulseiras' && isInfantilProduct(p.name))
        )
      } else if (category === 'berloques') {
        result = result.filter((p) => isBerloquesCategory(p.category))
      } else if (category === 'berloques-pulseiras') {
        result = result.filter(
          (p) =>
            p.category === 'berloques-pulseiras' ||
            (p.category === 'berloques' &&
              isPulseiraBerloqueProduct(p.name, p.description))
        )
      } else if (category === 'personalizados') {
        result = result.filter((p) => isPersonalizadosCategory(p.category))
      } else if (category === 'masculinos' || category === 'linha-masculina') {
        result = result.filter((p) => isMasculinosCategory(p.category))
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
              Nenhum produto encontrado nesta opção.
              {isBrincosFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Brincos</strong>, <strong>Duplas</strong> ou{' '}
                  <strong>Trios</strong> no painel.
                </>
              )}
              {isPulseirasFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Pulseiras</strong>, <strong>Braceletes</strong> ou{' '}
                  <strong>Infantil</strong> no painel.
                </>
              )}
              {isBerloquesFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Berloques</strong> ou{' '}
                  <strong>Pulseiras</strong> (para berloques) no painel.
                </>
              )}
              {isPersonalizadosFamily && (
                <>
                  {' '}
                  Cadastre peças de <strong>encomenda</strong> no painel
                  (Anéis, Colares, Pulseiras, Berloques ou Chaveiros).
                </>
              )}
              {isMasculinosFamily && (
                <>
                  {' '}
                  Cadastre produtos em <strong>Masculinos</strong> — Corrente,
                  Pulseira ou Pingente — no painel.
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
