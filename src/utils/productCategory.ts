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

/** Berloque com nome, família, data, foto etc. — vai em Personalizados → Berloques */
export function isPersonalizedBerloqueProduct(name: string, description?: string, slug = ''): boolean {
  const text = textBlob(name, slug, description)
  if (!/berloque/.test(text)) return false
  return (
    /personalizad|encomenda|sob medida|gravur/i.test(text) ||
    /com nome| c\/ nome|nome e|nome com|plaquinha|nascimento|dados do nascimento|digital|assinatura|com foto|com data|fam[ií]lia|forever|pata com nome|menina e menino com|cora[cç][aã]o com nome|berloque com dado/i.test(
      text
    )
  )
}

/** Pingente da linha masculina */
export function isMasculinePingenteProduct(name: string, description?: string, slug = ''): boolean {
  const text = textBlob(name, slug, description)
  if (!/pingente/.test(text)) return false
  return /masculin|manto masculino|linha masculina|para homem|crucifixo com manto masculino/i.test(text)
}

function isColarProduct(name: string, slug: string, description?: string): boolean {
  const text = textBlob(name, slug, description)
  return (
    /\bcolar\b|\bcolares\b|choker|escapul/i.test(text) ||
    /^colar-/i.test(slug.trim())
  )
}

function isBrincoProduct(name: string, slug: string): boolean {
  const text = textBlob(name, slug)
  return /\bbrinco/i.test(text) && !/\bcolar\b/i.test(text) && !/^colar-/i.test(slug.trim())
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
  if (isColarProduct(name, slug, description)) return 'colares'
  if (/corrente/.test(text)) return 'correntes'
  if (/pingente/.test(text)) {
    if (isMasculinePingenteProduct(name, description, slug)) return 'masculinos-pingente'
    return 'pingentes'
  }
  if (/berloque/.test(text)) {
    if (isPersonalizedBerloqueProduct(name, description, slug)) return 'personalizados-berloques'
    if (isPulseiraBerloqueProduct(name, description)) return 'berloques-pulseiras'
    return 'berloques'
  }
  if (isBrincoProduct(name, slug)) return 'brincos'
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

function finalizeCategory(category: CategorySlug, name: string, slug: string, description?: string): CategorySlug {
  if (isColarProduct(name, slug, description)) return 'colares'
  if (isPersonalizedBerloqueProduct(name, description, slug)) return 'personalizados-berloques'
  if (isMasculinePingenteProduct(name, description, slug)) return 'masculinos-pingente'

  if (isBrincosCategory(category)) return refineBrincosSubcategory(category, name)

  if (category === 'pulseiras') {
    if (isBraceleteProduct(name)) return 'pulseiras-braceletes'
    if (isInfantilProduct(name)) return 'pulseiras-infantil'
  }

  if (category === 'berloques' && isPulseiraBerloqueProduct(name, description)) {
    return 'berloques-pulseiras'
  }

  return category
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
    return finalizeCategory(
      isBrincosCategory(detected) ? refineBrincosSubcategory(detected, input.name) : detected,
      input.name,
      input.slug,
      input.description
    )
  }

  if (isBrincosCategory(current) && isColarProduct(input.name, input.slug, input.description)) {
    return 'colares'
  }

  return finalizeCategory(current, input.name, input.slug, input.description)
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
    return cat === 'berloques' || cat === 'berloques-pulseiras'
  }
  if (category === 'berloques-pulseiras') {
    return (
      cat === 'berloques-pulseiras' ||
      (cat === 'berloques' && isPulseiraBerloqueProduct(product.name, product.description))
    )
  }

  if (category === 'pingentes') {
    return cat === 'pingentes'
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
