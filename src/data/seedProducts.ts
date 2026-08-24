import type { Product } from '../types'

const CDN = 'https://dcdn-us.mitiendanube.com/stores/003/936/343/products'

export const products: Product[] = [
  {
    id: '1',
    slug: 'brinco-cravejado-coracao-pendurado-azul-royal',
    name: 'Brinco Cravejado Coração Pendurado — Azul Royal',
    description:
      'Brinco delicado em prata 925 com coração cravejado e pedra azul royal pendurada. Peça versátil que combina elegância e feminilidade para o dia a dia ou ocasiões especiais.',
    price: 145,
    images: [
      `${CDN}/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp`,
      `${CDN}/img_7459-jpg-ae93f851c77204047a17840546062480-640-0.webp`,
    ],
    category: 'brincos',
    badge: 'novidade',
    rating: 4.9,
    reviewCount: 47,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Evite contato com produtos químicos. Guarde em local seco.',
    shippingDays: 'Envio em até 24h úteis',
    isNew: true,
    isFeatured: true,
  },
  {
    id: '2',
    slug: 'colar-redondo-cravejado-verde-turmalina',
    name: 'Colar Redondo Cravejado — Verde Turmalina',
    description:
      'Colar em prata 925 com pingente redondo cravejado em verde turmalina. Uma peça sofisticada que ilumina qualquer look com sutileza e charme.',
    price: 155,
    images: [
      `${CDN}/img_4817-jpg-bc43e9cb0a124925e817801724891973-480-0.webp`,
    ],
    category: 'colares',
    rating: 4.8,
    reviewCount: 32,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Limpe com flanela macia. Evite água salgada.',
    shippingDays: 'Envio em até 24h úteis',
    isFeatured: true,
  },
  {
    id: '3',
    slug: 'anel-aparador-meia-alianca-2mm-translucido',
    name: 'Anel Aparador Meia Aliança 2mm — Translúcido',
    description:
      'Anel aparador em prata 925 com acabamento meia aliança de 2mm e pedras translúcidas. Perfeito para combinar com solitários ou usar sozinho.',
    price: 139,
    images: [
      `${CDN}/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp`,
    ],
    category: 'aneis',
    rating: 4.7,
    reviewCount: 28,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Remova ao realizar atividades físicas.',
    shippingDays: 'Envio em até 24h úteis',
    sizes: ['14', '16', '18', '20', '22'],
    isFeatured: true,
  },
  {
    id: '4',
    slug: 'colar-dois-coracoes',
    name: 'Colar Dois Corações',
    description:
      'Colar romântico em prata 925 com dois corações entrelaçados. Simboliza conexão e afeto — ideal para presentear quem você ama.',
    price: 189,
    images: [
      `${CDN}/img_4633-9c3c043dc188f7692c17807857126302-480-0.webp`,
    ],
    category: 'colares',
    rating: 5.0,
    reviewCount: 56,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Guarde na embalagem original quando não estiver usando.',
    shippingDays: 'Envio em até 24h úteis',
    isFeatured: true,
  },
  {
    id: '5',
    slug: 'anel-solitario-pedra-unica-azul-royal',
    name: 'Anel Solitário Pedra Única — Azul Royal',
    description:
      'Anel solitário clássico em prata 925 com pedra azul royal. Elegância atemporal em uma peça que nunca sai de moda.',
    price: 99,
    salePrice: 79,
    images: [
      `${CDN}/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp`,
    ],
    category: 'aneis',
    badge: 'oferta-especial',
    rating: 4.9,
    reviewCount: 41,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Evite contato com perfumes e cremes.',
    shippingDays: 'Envio em até 24h úteis',
    sizes: ['16', '18', '20', '22'],
    isOnSale: true,
    isFeatured: true,
  },
  {
    id: '6',
    slug: 'trio-argola-redonda-cravejada-fecho-tarraxa',
    name: 'Trio Argola Redonda Cravejada — Fecho Tarraxa',
    description:
      'Conjunto de três argolas em prata 925 cravejadas com fecho tarraxa. Versatilidade para usar juntas ou separadas.',
    price: 319,
    images: [
      `${CDN}/img_1216-jpg-d16ce5b4c77552954417798372394070-480-0.webp`,
    ],
    category: 'brincos',
    rating: 4.8,
    reviewCount: 23,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Limpe regularmente com pano de prata.',
    shippingDays: 'Envio em até 24h úteis',
    isFeatured: true,
  },
  {
    id: '7',
    slug: 'pulseira-piastrine-25mm',
    name: 'Pulseira Piastrine 2,5mm',
    description:
      'Pulseira em prata 925 com elos piastrine de 2,5mm. Peça clássica e atemporal, perfeita para uso diário ou sobreposição.',
    price: 129,
    images: [
      `${CDN}/img_7549-240e76c14ba192830017842945307545-480-0.webp`,
    ],
    category: 'pulseiras',
    rating: 4.6,
    reviewCount: 19,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Evite exposição prolongada ao sol.',
    shippingDays: 'Envio em até 24h úteis',
    isFeatured: true,
  },
  {
    id: '8',
    slug: 'conjunto-coracao-cravejado-vermelho',
    name: 'Conjunto Coração Cravejado — Vermelho',
    description:
      'Conjunto harmonioso de colar e pulseira em prata 925 com corações cravejados em vermelho. Presente perfeito para momentos especiais.',
    price: 299,
    salePrice: 249,
    images: [
      `${CDN}/img_4633-9c3c043dc188f7692c17807857126302-480-0.webp`,
    ],
    category: 'conjuntos',
    badge: 'promocao',
    rating: 4.9,
    reviewCount: 34,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Guarde separadamente das outras peças.',
    shippingDays: 'Envio em até 24h úteis',
    isOnSale: true,
  },
  {
    id: '9',
    slug: 'escapulario-feminino',
    name: 'Escapulário Feminino — Cruz Cravejada e Espírito Santo',
    description:
      'Escapulário delicado em prata 925 com cruz cravejada e medalha do Espírito Santo. Fé e elegância em uma única peça.',
    price: 229,
    images: [
      `${CDN}/img_4817-jpg-bc43e9cb0a124925e817801724891973-480-0.webp`,
    ],
    category: 'colares',
    rating: 5.0,
    reviewCount: 62,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Evite contato com água durante banho.',
    shippingDays: 'Envio em até 24h úteis',
  },
  {
    id: '10',
    slug: 'anel-v-cravejado-gota-translucida',
    name: 'Anel V Cravejado — Gota Translúcida',
    description:
      'Anel em formato V cravejado com gota translúcida central. Design moderno que valoriza a feminilidade com ousadia.',
    price: 149,
    images: [
      `${CDN}/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp`,
    ],
    category: 'aneis',
    badge: 'novidade',
    rating: 4.7,
    reviewCount: 15,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Remova antes de dormir.',
    shippingDays: 'Envio em até 24h úteis',
    sizes: ['16', '18', '20', '21', '22'],
    isNew: true,
  },
  {
    id: '11',
    slug: 'pulseira-de-berloques-coracao-cravejado',
    name: 'Pulseira de Berloques Coração Cravejado',
    description:
      'Pulseira para berloques em prata 925 com coração cravejado. Personalize com charms e conte sua história única.',
    price: 435,
    images: [
      `${CDN}/img_7549-240e76c14ba192830017842945307545-480-0.webp`,
    ],
    category: 'berloques',
    rating: 4.9,
    reviewCount: 38,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Adicione berloques com cuidado para não forçar o fecho.',
    shippingDays: 'Envio em até 24h úteis',
  },
  {
    id: '12',
    slug: 'brinco-cravejado-coracao-pendurado-translucido',
    name: 'Brinco Cravejado Coração Pendurado — Translúcido',
    description:
      'Versão translúcida do queridinho coração pendurado. Brinco em prata 925 que combina com qualquer estilo.',
    price: 145,
    salePrice: 125,
    images: [
      `${CDN}/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp`,
    ],
    category: 'brincos',
    badge: 'oferta-especial',
    rating: 4.8,
    reviewCount: 29,
    inStock: true,
    material: 'Prata 925',
    warranty: 'Garantia vitalícia com certificado',
    care: 'Limpe com flanela macia após o uso.',
    shippingDays: 'Envio em até 24h úteis',
    isOnSale: true,
  },
]

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug)
}

export function getProductsByCategory(category: string): Product[] {
  if (category === 'novidades') {
    return products.filter((p) => p.isNew)
  }
  return products.filter((p) => p.category === category)
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.isFeatured)
}

export function getSaleProducts(): Product[] {
  return products.filter((p) => p.isOnSale)
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit)
}

export function searchProducts(query: string): Product[] {
  const q = query.toLowerCase().trim()
  if (!q) return []
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.category.includes(q)
  )
}
