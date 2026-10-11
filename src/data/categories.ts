import type { Category } from '../types'
import { localCategoryImage } from '../utils/legacyImages'

export const categories: Category[] = [
  {
    slug: 'aneis',
    name: 'Anéis',
    description: 'Solitários, aparadores e alianças em prata 925',
    image: localCategoryImage('aneis'),
  },
  {
    slug: 'brincos',
    name: 'Brincos',
    description: 'Todos os brincos em prata 925 — unitários, duplas e trios',
    image: localCategoryImage('brincos'),
  },
  {
    slug: 'brincos-duplas',
    name: 'Duplas',
    description: 'Pares de brincos em prata 925',
    image: localCategoryImage('brincos-duplas'),
  },
  {
    slug: 'brincos-trios',
    name: 'Trios',
    description: 'Conjuntos de três brincos em prata 925 — perfeitos para múltiplos furos',
    image: localCategoryImage('brincos-trios'),
  },
  {
    slug: 'colares',
    name: 'Colares',
    description: 'Colares, chokers e escapulários delicados',
    image: localCategoryImage('colares'),
  },
  {
    slug: 'conjuntos',
    name: 'Conjuntos',
    description: 'Harmonia perfeita em colar e pulseira',
    image: localCategoryImage('conjuntos'),
  },
  {
    slug: 'correntes',
    name: 'Correntes',
    description: 'Correntes clássicas e contemporâneas em prata 925',
    image: localCategoryImage('correntes'),
  },
  {
    slug: 'pingentes',
    name: 'Pingentes',
    description: 'Pingentes delicados para personalizar seu look',
    image: localCategoryImage('pingentes'),
  },
  {
    slug: 'pulseiras',
    name: 'Pulseiras',
    description: 'Todas as pulseiras em prata 925 — clássicas, braceletes e infantil',
    image: localCategoryImage('pulseiras'),
  },
  {
    slug: 'pulseiras-braceletes',
    name: 'Braceletes',
    description: 'Braceletes em prata 925',
    image: localCategoryImage('pulseiras-braceletes'),
  },
  {
    slug: 'pulseiras-infantil',
    name: 'Infantil',
    description: 'Pulseiras infantis em prata 925',
    image: localCategoryImage('pulseiras-infantil'),
  },
  {
    slug: 'berloques',
    name: 'Berloques',
    description: 'Personalize sua pulseira com charme — berloques e pulseiras para berloques',
    image: localCategoryImage('berloques'),
  },
  {
    slug: 'berloques-pulseiras',
    name: 'Pulseiras',
    description: 'Pulseiras para montar e personalizar com berloques',
    image: localCategoryImage('berloques-pulseiras'),
  },
  {
    slug: 'piercings',
    name: 'Piercings',
    description: 'Piercings em prata 925 com acabamento sofisticado',
    image: localCategoryImage('piercings'),
  },
  {
    slug: 'tornozeleiras',
    name: 'Tornozeleiras',
    description: 'Tornozeleiras delicadas em prata 925',
    image: localCategoryImage('tornozeleiras'),
  },
  {
    slug: 'personalizados',
    name: 'Personalizados',
    description: 'Peças sob encomenda — personalize do seu jeito',
    image: localCategoryImage('personalizados'),
  },
  {
    slug: 'personalizados-aneis',
    name: 'Anéis personalizados',
    description: 'Anéis sob encomenda em prata 925',
    image: localCategoryImage('personalizados-aneis'),
  },
  {
    slug: 'personalizados-colares',
    name: 'Colares personalizados',
    description: 'Colares sob encomenda em prata 925',
    image: localCategoryImage('personalizados-colares'),
  },
  {
    slug: 'personalizados-pulseiras',
    name: 'Pulseiras personalizadas',
    description: 'Pulseiras sob encomenda em prata 925',
    image: localCategoryImage('personalizados-pulseiras'),
  },
  {
    slug: 'personalizados-berloques',
    name: 'Berloques personalizados',
    description: 'Berloques sob encomenda em prata 925',
    image: localCategoryImage('personalizados-berloques'),
  },
  {
    slug: 'personalizados-chaveiros',
    name: 'Chaveiros personalizados',
    description: 'Chaveiros sob encomenda em prata 925',
    image: localCategoryImage('personalizados-chaveiros'),
  },
  {
    slug: 'personalizados-pingentes',
    name: 'Pingentes personalizados',
    description: 'Pingentes sob encomenda em prata 925',
    image: localCategoryImage('personalizados-pingentes'),
  },
  {
    slug: 'masculinos',
    name: 'Masculinos',
    description: 'Linha masculina em prata 925',
    image: localCategoryImage('masculinos'),
  },
  {
    slug: 'masculinos-corrente',
    name: 'Corrente masculina',
    description: 'Correntes da linha masculina em prata 925',
    image: localCategoryImage('masculinos-corrente'),
  },
  {
    slug: 'masculinos-pulseira',
    name: 'Pulseira masculina',
    description: 'Pulseiras da linha masculina em prata 925',
    image: localCategoryImage('masculinos-pulseira'),
  },
  {
    slug: 'masculinos-pingente',
    name: 'Pingente masculino',
    description: 'Pingentes da linha masculina em prata 925',
    image: localCategoryImage('masculinos-pingente'),
  },
  {
    slug: 'acessorios',
    name: 'Acessórios',
    description: 'Limpa pratas, porta-joias, organizadores e complementos para cuidar das suas peças',
    image: localCategoryImage('acessorios'),
  },
  {
    slug: 'novidades',
    name: 'Novidades',
    description: 'As últimas peças que acabaram de chegar',
    image: localCategoryImage('novidades'),
  },
]

export const categoryLabels: Record<string, string> = {
  aneis: 'Anéis',
  brincos: 'Brincos',
  'brincos-trios': 'Trios',
  'brincos-duplas': 'Duplas',
  colares: 'Colares',
  conjuntos: 'Conjuntos',
  correntes: 'Correntes',
  pingentes: 'Pingentes',
  pulseiras: 'Pulseiras',
  'pulseiras-braceletes': 'Braceletes',
  'pulseiras-infantil': 'Infantil',
  berloques: 'Berloques',
  'berloques-pulseiras': 'Pulseiras',
  piercings: 'Piercings',
  tornozeleiras: 'Tornozeleiras',
  personalizados: 'Personalizados (encomenda)',
  'personalizados-aneis': 'Anéis',
  'personalizados-colares': 'Colares',
  'personalizados-pulseiras': 'Pulseiras',
  'personalizados-berloques': 'Berloques',
  'personalizados-chaveiros': 'Chaveiros',
  'personalizados-pingentes': 'Pingentes',
  masculinos: 'Masculinos',
  'masculinos-corrente': 'Corrente',
  'masculinos-pulseira': 'Pulseira',
  'masculinos-pingente': 'Pingente',
  acessorios: 'Acessórios',
  novidades: 'Novidades',
  relogios: 'Relógios',
  'linha-masculina': 'Masculinos',
}

/** Categorias exibidas na home (sem subcategorias de menu) */
export const homeCategories = categories
  .filter(
    (c) =>
      ![
        'brincos-trios',
        'brincos-duplas',
        'pulseiras-braceletes',
        'pulseiras-infantil',
        'berloques-pulseiras',
        'personalizados-aneis',
        'personalizados-colares',
        'personalizados-pulseiras',
        'personalizados-berloques',
        'personalizados-chaveiros',
        'personalizados-pingentes',
        'masculinos-corrente',
        'masculinos-pulseira',
        'masculinos-pingente',
        'acessorios',
        'novidades',
      ].includes(c.slug)
  )
  .map((c) => (c.slug === 'brincos' ? { ...c, name: 'Brincos' } : c))

/** Grid da home — categorias com fotos próprias */
export const HOME_CATEGORY_NAV = [
  { name: 'Anéis', slug: 'aneis', image: '/categories/aneis.png' },
  { name: 'Pulseiras', slug: 'pulseiras', image: '/categories/pulseiras.png' },
  { name: 'Colares', slug: 'colares', image: '/categories/colares.png' },
  { name: 'Brincos', slug: 'brincos', image: '/categories/brincos.png' },
  { name: 'Braceletes', slug: 'pulseiras-braceletes', image: '/categories/braceletes.png' },
  { name: 'Masculino', slug: 'masculinos', image: '/categories/masculinos.png' },
  { name: 'Conjuntos', slug: 'conjuntos', image: '/categories/conjuntos.png' },
  { name: 'Piercings', slug: 'piercings', image: '/categories/piercings.png' },
  { name: 'Personalizados', slug: 'personalizados', image: '/categories/personalizados.png' },
  { name: 'Tornozeleiras', slug: 'tornozeleiras', image: '/categories/tornozeleiras.png' },
  { name: 'Correntes', slug: 'correntes', image: '/categories/correntes.png' },
  { name: 'Berloques', slug: 'berloques', image: '/categories/berloques.png' },
] as const
