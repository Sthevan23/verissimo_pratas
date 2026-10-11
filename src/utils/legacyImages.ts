/** Fotos do site antigo (MitiendaNube / TiendaNube) — não usar na Verissimo. */
export function isLegacyForeignImage(url: string | undefined | null): boolean {
  if (!url) return false
  return /mitiendanube\.com|tiendanube\.com|dcdn-us\.mitiendanube/i.test(url)
}

/** Foto local da categoria (pasta /categories). */
export function localCategoryImage(slug: string): string {
  const base = slug.split('-')[0]
  const map: Record<string, string> = {
    aneis: '/categories/aneis.png',
    brincos: '/categories/brincos.png',
    'brincos-duplas': '/categories/brincos.png',
    'brincos-trios': '/categories/brincos.png',
    colares: '/categories/colares.png',
    conjuntos: '/categories/conjuntos.png',
    correntes: '/categories/correntes.png',
    pingentes: '/categories/correntes.png',
    pulseiras: '/categories/pulseiras.png',
    'pulseiras-braceletes': '/categories/braceletes.png',
    'pulseiras-infantil': '/categories/pulseiras.png',
    berloques: '/categories/berloques.png',
    'berloques-pulseiras': '/categories/berloques.png',
    piercings: '/categories/piercings.png',
    tornozeleiras: '/categories/tornozeleiras.png',
    personalizados: '/categories/personalizados.png',
    'personalizados-aneis': '/categories/aneis.png',
    'personalizados-colares': '/categories/colares.png',
    'personalizados-pulseiras': '/categories/pulseiras.png',
    'personalizados-berloques': '/categories/berloques.png',
    'personalizados-chaveiros': '/categories/personalizados.png',
    'personalizados-pingentes': '/categories/personalizados.png',
    masculinos: '/categories/masculinos.png',
    'masculinos-corrente': '/categories/masculinos.png',
    'masculinos-pulseira': '/categories/masculinos.png',
    'masculinos-pingente': '/categories/masculinos.png',
    acessorios: '/categories/acessorios.png',
    novidades: '/categories/aneis.png',
    promocoes: '/categories/aneis.png',
    'linha-masculina': '/categories/masculinos.png',
  }
  return map[slug] || map[base] || '/categories/aneis.png'
}

export function stripLegacyImages(images: string[] | undefined): string[] {
  return (Array.isArray(images) ? images : []).filter(
    (img) => typeof img === 'string' && img.trim() && !isLegacyForeignImage(img)
  )
}
