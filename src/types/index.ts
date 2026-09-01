export type CategorySlug =
  | 'aneis'
  | 'brincos'
  | 'brincos-trios'
  | 'brincos-duplas'
  | 'colares'
  | 'correntes'
  | 'pingentes'
  | 'pulseiras'
  | 'pulseiras-braceletes'
  | 'pulseiras-infantil'
  | 'berloques'
  | 'berloques-pulseiras'
  | 'piercings'
  | 'tornozeleiras'
  | 'acessorios'
  | 'conjuntos'
  | 'personalizados'
  | 'personalizados-aneis'
  | 'personalizados-colares'
  | 'personalizados-pulseiras'
  | 'personalizados-berloques'
  | 'personalizados-chaveiros'
  | 'masculinos'
  | 'masculinos-corrente'
  | 'masculinos-pulseira'
  | 'masculinos-pingente'
  | 'novidades'
  | 'relogios'
  | 'linha-masculina'

export interface ProductOption {
  /** Identificador interno, ex: fecho */
  id: string
  /** Nome exibido ao cliente, ex: Fecho */
  label: string
  values: string[]
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  salePrice?: number
  images: string[]
  category: CategorySlug
  badge?: 'novidade' | 'promocao' | 'oferta-especial'
  rating: number
  reviewCount: number
  inStock: boolean
  /** Unidades em estoque (quando controlado) */
  stock?: number
  material: string
  warranty: string
  care: string
  shippingDays: string
  sizes?: string[]
  /** Opções de escolha do cliente (fecho, cor, etc.) */
  options?: ProductOption[]
  isNew?: boolean
  isFeatured?: boolean
  isOnSale?: boolean
}

export interface Category {
  slug: CategorySlug
  name: string
  image: string
  description: string
}

export interface CartItem {
  product: Product
  quantity: number
  selectedSize?: string
  /** Ex: { fecho: "Coração cravejado" } */
  selectedChoices?: Record<string, string>
}

export interface Testimonial {
  id: string
  name: string
  rating: number
  text: string
  location?: string
}

export interface SearchResult {
  type: 'product' | 'category' | 'suggestion'
  id: string
  label: string
  href: string
  image?: string
  price?: number
}
