import type { CategorySlug } from '../types'

const BRINCOS_SLUGS = new Set<CategorySlug>(['brincos', 'brincos-duplas', 'brincos-trios'])
const PULSEIRAS_SLUGS = new Set<CategorySlug>([
  'pulseiras',
  'pulseiras-braceletes',
  'pulseiras-infantil',
])

export function isBrincosCategory(cat: string): cat is CategorySlug {
  return BRINCOS_SLUGS.has(cat as CategorySlug)
}

export function isPulseirasCategory(cat: string): cat is CategorySlug {
  return PULSEIRAS_SLUGS.has(cat as CategorySlug)
}

export function isBerloquesCategory(cat: string): boolean {
  return cat === 'berloques' || cat === 'berloques-pulseiras'
}

export function isPersonalizadosCategory(cat: string): boolean {
  return cat === 'personalizados' || cat.startsWith('personalizados-')
}

export function isMasculinosCategory(cat: string): boolean {
  return cat === 'masculinos' || cat.startsWith('masculinos-') || cat === 'linha-masculina'
}

function textBlob(name: string, slug: string, description?: string): string {
  return `${name} ${slug} ${description ?? ''}`.toLowerCase()
}

export function isTrioProduct(name: string): boolean {
  return /\btrio\b/i.test(name)
}

export function isDuplaProduct(name: string): boolean {
  return /\bdupla(s)?\b/i.test(name)
}

function isBraceleteProduct(name: string): boolean {
  return /bracelete|bracelet/i.test(name)
}

function isInfantilProduct(name: string): boolean {
  return /infantil|crian[cç]a|baby|kids/i.test(name)
}

function isPulseiraBerloqueProduct(name: string, description?: string): boolean {
  const text = `${name} ${description ?? ''}`
  return /pulseira.*berloque|berloque.*pulseira|para berloques|pulseira de berloques/i.test(text)
}

/** Inferência pelo nome/slug — cada peça na vitrine correta */
export function detectCategoryFromText(
  name: string,
  slug: string,
  description?: string
): CategorySlug | null {
  const text = textBlob(name, slug, description)

  if (/personalizad|encomenda|sob medida/.test(text)) {
    if (/anel|alian[cç]a/.test(text)) return 'personalizados-aneis'
    if (/colar|choker|escapul/.test(text)) return 'personalizados-colares'
    if (/pulseira|bracelete/.test(text)) return 'personalizados-pulseiras'
    if (/berloque/.test(text)) return 'personalizados-berloques'
    if (/chaveiro/.test(text)) return 'personalizados-chaveiros'
    if (/pingente/.test(text)) return 'personalizados-pingentes'
    return 'personalizados'
  }
  if (/conjunto/.test(text)) return 'conjuntos'
  if (/tornozeleira/.test(text)) return 'tornozeleiras'
  if (/masculin/.test(text)) {
    if (/corrente/.test(text)) return 'masculinos-corrente'
    if (/pulseira/.test(text)) return 'masculinos-pulseira'
    if (/pingente/.test(text)) return 'masculinos-pingente'
    return 'masculinos'
  }
  if (/piercing|helix|tragus|septo|umbigo|labret|daith/.test(text)) return 'piercings'
  if (/colar|choker|escapul/.test(text)) return 'colares'
  if (/corrente/.test(text)) return 'correntes'
  if (/pingente/.test(text)) return 'pingentes'
  if (/berloque/.test(text)) {
    if (isPulseiraBerloqueProduct(name, description)) return 'berloques-pulseiras'
    return 'berloques'
  }
  if (/brinco/.test(text)) return 'brincos'
  if (/pulseira|bracelete/.test(text)) {
    if (isInfantilProduct(name)) return 'pulseiras-infantil'
    if (isBraceleteProduct(name)) return 'pulseiras-braceletes'
    return 'pulseiras'
  }
  if (/anel|alian[cç]a/.test(text)) return 'aneis'
  if (/acess|limpa prata|organizador|porta.?joia/.test(text)) return 'acessorios'
  return null
}

function refineBrincosSubcategory(category: CategorySlug, name: string): CategorySlug {
  if (!isBrincosCategory(category)) return category
  if (isTrioProduct(name)) return 'brincos-trios'
  if (isDuplaProduct(name)) return 'brincos-duplas'
  return 'brincos'
}

function storefrontFamily(cat: string): string {
  if (isBrincosCategory(cat)) return 'brincos'
  if (cat === 'piercings') return 'piercings'
  if (cat === 'colares') return 'colares'
  if (isPulseirasCategory(cat)) return 'pulseiras'
  if (cat === 'aneis') return 'aneis'
  if (isBerloquesCategory(cat)) return 'berloques'
  if (isPersonalizadosCategory(cat)) return 'personalizados'
  if (isMasculinosCategory(cat)) return 'masculinos'
  return cat
}

/** Corrige categoria errada no cadastro (ex.: colar marcado como brinco) */
export function normalizeProductCategory(input: {
  name: string
  slug: string
  description?: string
  category: string
}): CategorySlug {
  const current = (input.category || 'brincos') as CategorySlug
  const detected = detectCategoryFromText(input.name, input.slug, input.description)

  if (detected) {
    const sameFamily = storefrontFamily(detected) === storefrontFamily(current)
    if (!sameFamily) {
      return isBrincosCategory(detected)
        ? refineBrincosSubcategory(detected, input.name)
        : detected
    }
  }

  if (isBrincosCategory(current)) {
    return refineBrincosSubcategory(current, input.name)
  }

  if (current === 'pulseiras') {
    if (isBraceleteProduct(input.name)) return 'pulseiras-braceletes'
    if (isInfantilProduct(input.name)) return 'pulseiras-infantil'
  }

  if (current === 'berloques' && isPulseiraBerloqueProduct(input.name, input.description)) {
    return 'berloques-pulseiras'
  }

  return current
}

/** Filtro da vitrine — só o que pertence à categoria do card */
export function matchesStoreCategoryFilter(
  product: { category: string; name: string; description?: string; isNew?: boolean },
  category: string
): boolean {
  const cat = product.category

  if (category === 'novidades') return Boolean(product.isNew)

  if (category === 'brincos') {
    return isBrincosCategory(cat)
  }
  if (category === 'brincos-trios') {
    return cat === 'brincos-trios' || (cat === 'brincos' && isTrioProduct(product.name))
  }
  if (category === 'brincos-duplas') {
    return cat === 'brincos-duplas' || (cat === 'brincos' && isDuplaProduct(product.name))
  }

  if (category === 'pulseiras') {
    return isPulseirasCategory(cat)
  }
  if (category === 'pulseiras-braceletes') {
    return (
      cat === 'pulseiras-braceletes' ||
      (cat === 'pulseiras' && isBraceleteProduct(product.name))
    )
  }
  if (category === 'pulseiras-infantil') {
    return (
      cat === 'pulseiras-infantil' ||
      (cat === 'pulseiras' && isInfantilProduct(product.name))
    )
  }

  if (category === 'berloques') {
    return isBerloquesCategory(cat)
  }
  if (category === 'berloques-pulseiras') {
    return (
      cat === 'berloques-pulseiras' ||
      (cat === 'berloques' && isPulseiraBerloqueProduct(product.name, product.description))
    )
  }

  if (category === 'personalizados') {
    return isPersonalizadosCategory(cat)
  }
  if (category.startsWith('personalizados-')) {
    return cat === category
  }

  if (category === 'masculinos' || category === 'linha-masculina') {
    return isMasculinosCategory(cat)
  }
  if (category.startsWith('masculinos-')) {
    return cat === category
  }

  if (category === 'aneis') {
    return cat === 'aneis' && !isBraceleteProduct(product.name)
  }

  return cat === category
}
