import type { Category } from '../types'

const CDN = 'https://dcdn-us.mitiendanube.com/stores/003/936/343'

export const categories: Category[] = [
  {
    slug: 'aneis',
    name: 'Anéis',
    description: 'Solitários, aparadores e alianças em prata 925',
    image: `${CDN}/products/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp`,
  },
  {
    slug: 'brincos',
    name: 'Brincos',
    description: 'Todos os brincos em prata 925 — unitários, duplas e trios',
    image: `${CDN}/products/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp`,
  },
  {
    slug: 'brincos-duplas',
    name: 'Duplas',
    description: 'Pares de brincos em prata 925',
    image: `${CDN}/products/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp`,
  },
  {
    slug: 'brincos-trios',
    name: 'Trios',
    description: 'Conjuntos de três brincos em prata 925 — perfeitos para múltiplos furos',
    image: `${CDN}/products/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp`,
  },
  {
    slug: 'colares',
    name: 'Colares',
    description: 'Colares, chokers e escapulários delicados',
    image: `${CDN}/products/img_4817-jpg-bc43e9cb0a124925e817801724891973-480-0.webp`,
  },
  {
    slug: 'correntes',
    name: 'Correntes',
    description: 'Correntes clássicas e contemporâneas em prata 925',
    image: `${CDN}/products/img_4817-jpg-bc43e9cb0a124925e817801724891973-480-0.webp`,
  },
  {
    slug: 'pingentes',
    name: 'Pingentes',
    description: 'Pingentes delicados para personalizar seu look',
    image: `${CDN}/products/img_4633-9c3c043dc188f7692c17807857126302-480-0.webp`,
  },
  {
    slug: 'pulseiras',
    name: 'Pulseiras',
    description: 'Todas as pulseiras em prata 925 — clássicas, braceletes e infantil',
    image: `${CDN}/products/img_7549-240e76c14ba192830017842945307545-480-0.webp`,
  },
  {
    slug: 'pulseiras-braceletes',
    name: 'Braceletes',
    description: 'Braceletes em prata 925',
    image: `${CDN}/products/img_7549-240e76c14ba192830017842945307545-480-0.webp`,
  },
  {
    slug: 'pulseiras-infantil',
    name: 'Infantil',
    description: 'Pulseiras infantis em prata 925',
    image: `${CDN}/products/img_7549-240e76c14ba192830017842945307545-480-0.webp`,
  },
  {
    slug: 'berloques',
    name: 'Berloques',
    description: 'Personalize sua pulseira com charme',
    image: `${CDN}/products/img_4633-9c3c043dc188f7692c17807857126302-480-0.webp`,
  },
  {
    slug: 'piercings',
    name: 'Piercings',
    description: 'Piercings em prata 925 com acabamento sofisticado',
    image: `${CDN}/products/img_1216-jpg-d16ce5b4c77552954417798372394070-480-0.webp`,
  },
  {
    slug: 'tornozeleiras',
    name: 'Tornozeleiras',
    description: 'Tornozeleiras delicadas em prata 925',
    image: `${CDN}/products/img_7549-240e76c14ba192830017842945307545-480-0.webp`,
  },
  {
    slug: 'acessorios',
    name: 'Acessórios',
    description: 'Porta-joias, organizadores e complementos para sua coleção',
    image: `${CDN}/products/img_4633-9c3c043dc188f7692c17807857126302-480-0.webp`,
  },
  {
    slug: 'conjuntos',
    name: 'Conjuntos',
    description: 'Harmonia perfeita em colar e pulseira',
    image: `${CDN}/products/img_4633-9c3c043dc188f7692c17807857126302-480-0.webp`,
  },
  {
    slug: 'novidades',
    name: 'Novidades',
    description: 'As últimas peças que acabaram de chegar',
    image: `${CDN}/products/img_1216-jpg-d16ce5b4c77552954417798372394070-480-0.webp`,
  },
]

export const categoryLabels: Record<string, string> = {
  aneis: 'Anéis',
  brincos: 'Brincos',
  'brincos-trios': 'Trios',
  'brincos-duplas': 'Duplas',
  colares: 'Colares',
  correntes: 'Correntes',
  pingentes: 'Pingentes',
  pulseiras: 'Pulseiras',
  'pulseiras-braceletes': 'Braceletes',
  'pulseiras-infantil': 'Infantil',
  berloques: 'Berloques',
  piercings: 'Piercings',
  tornozeleiras: 'Tornozeleiras',
  acessorios: 'Acessórios',
  conjuntos: 'Conjuntos',
  novidades: 'Novidades',
  relogios: 'Relógios',
  'linha-masculina': 'Linha Masculina',
}

/** Categorias exibidas na home (sem subcategorias de brincos) */
export const homeCategories = categories
  .filter(
    (c) =>
      ![
        'brincos-trios',
        'brincos-duplas',
        'pulseiras-braceletes',
        'pulseiras-infantil',
        'conjuntos',
        'novidades',
      ].includes(c.slug)
  )
  .map((c) => (c.slug === 'brincos' ? { ...c, name: 'Brincos' } : c))
