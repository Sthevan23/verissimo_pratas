import { Helmet } from 'react-helmet-async'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heart, Minus, Plus, Star, Truck, Shield, Gem, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { getProductBySlug, getRelatedProducts } from '../data/products'
import { useApp } from '../context/AppContext'
import {
  calcDiscount,
  cn,
  formatInstallments,
  formatPrice,
} from '../utils/format'
import { Button } from '../components/ui/Button'
import { ProductCard } from '../components/ProductCard'
import { AnimateIn } from '../components/ui/AnimateIn'

export function ProductDetails() {
  const { slug } = useParams<{ slug: string }>()
  const product = slug ? getProductBySlug(slug) : undefined
  const navigate = useNavigate()
  const { addToCart, toggleFavorite, isFavorite, openCart } = useApp()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<string | undefined>()
  const [zoomed, setZoomed] = useState(false)

  if (!product) {
    return (
      <div className="header-offset container-brand py-32 text-center">
        <h1 className="heading-display text-3xl mb-4">Produto não encontrado</h1>
        <Button onClick={() => navigate('/produtos')}>Ver produtos</Button>
      </div>
    )
  }

  const currentPrice = product.salePrice ?? product.price
  const related = getRelatedProducts(product)
  const favorite = isFavorite(product.id)

  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) return
    addToCart(product, quantity, selectedSize)
    openCart()
  }

  return (
    <>
      <Helmet>
        <title>{product.name} — Verissimo Pratas 925</title>
        <meta name="description" content={product.description} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product.name,
            image: product.images,
            description: product.description,
            brand: { '@type': 'Brand', name: 'Verissimo Pratas 925' },
            offers: {
              '@type': 'Offer',
              priceCurrency: 'BRL',
              price: currentPrice,
              availability: product.inStock
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            },
          })}
        </script>
      </Helmet>

      <div className="header-offset pb-16 sm:pb-20">
        <div className="container-brand">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
            {/* Gallery */}
            <AnimateIn direction="left">
              <div className="space-y-4">
                <div
                  className="relative aspect-square bg-off-white overflow-hidden lg:cursor-zoom-in"
                  onClick={() => {
                    if (window.matchMedia('(min-width: 1024px)').matches) {
                      setZoomed(!zoomed)
                    }
                  }}
                >
                  <motion.img
                    key={selectedImage}
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className={cn(
                      'w-full h-full object-cover transition-transform duration-500',
                      zoomed && 'scale-150'
                    )}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedImage(i)
                          setZoomed(false)
                        }}
                        className={cn(
                          'w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-off-white overflow-hidden border-2 transition-colors',
                          i === selectedImage ? 'border-graphite' : 'border-transparent'
                        )}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </AnimateIn>

            {/* Info */}
            <AnimateIn direction="right" delay={0.15}>
              <div className="lg:sticky lg:top-32">
                {product.badge && (
                  <span className="inline-block text-[10px] tracking-[0.2em] uppercase bg-graphite text-cream px-3 py-1.5 mb-4">
                    {product.badge === 'novidade'
                      ? 'Novidade'
                      : product.badge === 'oferta-especial'
                        ? 'Oferta especial'
                        : 'Promoção'}
                  </span>
                )}

                <h1 className="heading-display text-2xl sm:text-3xl lg:text-4xl text-graphite mb-3">
                  {product.name}
                </h1>

                <div className="flex items-center gap-2 mb-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-3.5 h-3.5',
                          i < Math.floor(product.rating)
                            ? 'fill-graphite text-graphite'
                            : 'text-border'
                        )}
                        strokeWidth={1}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-muted">
                    {product.rating} ({product.reviewCount} avaliações)
                  </span>
                </div>

                <div className="mb-6">
                  {product.salePrice ? (
                    <div className="flex items-baseline gap-3 flex-wrap">
                      <span className="text-lg text-muted line-through">
                        {formatPrice(product.price)}
                      </span>
                      <span className="text-2xl font-medium text-graphite">
                        {formatPrice(product.salePrice)}
                      </span>
                      <span className="text-sm text-silver-dark">
                        -{calcDiscount(product.price, product.salePrice)}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-2xl font-medium text-graphite">
                      {formatPrice(product.price)}
                    </span>
                  )}
                  <p className="text-sm text-muted mt-1">
                    {formatInstallments(currentPrice)} · ou {formatPrice(currentPrice * 0.95)} no Pix
                  </p>
                </div>

                <p className="text-warm-gray font-light leading-relaxed mb-8">
                  {product.description}
                </p>

                {product.sizes && (
                  <div className="mb-6">
                    <p className="text-[11px] tracking-[0.15em] uppercase text-muted mb-3">
                      Tamanho
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={cn(
                            'w-11 h-11 border text-sm transition-colors',
                            selectedSize === size
                              ? 'border-graphite bg-graphite text-cream'
                              : 'border-border hover:border-graphite'
                          )}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    {!selectedSize && (
                      <p className="text-xs text-muted mt-2">Selecione um tamanho</p>
                    )}
                  </div>
                )}

                <div className="mb-8">
                  <p className="text-[11px] tracking-[0.15em] uppercase text-muted mb-3">
                    Quantidade
                  </p>
                  <div className="inline-flex items-center border border-border">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-off-white transition-colors"
                      aria-label="Diminuir"
                    >
                      <Minus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <span className="px-5 text-sm">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-off-white transition-colors"
                      aria-label="Aumentar"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:grid sm:grid-cols-[1fr_1fr_auto] gap-3 mb-8">
                  <Button
                    size="lg"
                    className="w-full"
                    onClick={handleAddToCart}
                    disabled={!product.inStock || (product.sizes && !selectedSize)}
                  >
                    Adicionar ao carrinho
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    className="w-full"
                    onClick={handleAddToCart}
                    disabled={!product.inStock}
                  >
                    Comprar agora
                  </Button>
                  <button
                    onClick={() => toggleFavorite(product.id)}
                    className="touch-target border border-border hover:border-graphite active:border-graphite transition-colors self-center sm:self-auto"
                    aria-label="Favoritar"
                  >
                    <Heart
                      className={cn(
                        'w-5 h-5',
                        favorite ? 'fill-graphite text-graphite' : 'text-graphite'
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-border">
                  <InfoItem icon={Gem} label="Material" value={product.material} />
                  <InfoItem icon={Shield} label="Garantia" value={product.warranty} />
                  <InfoItem icon={Clock} label="Envio" value={product.shippingDays} />
                  <InfoItem
                    icon={Truck}
                    label="Disponibilidade"
                    value={product.inStock ? 'Em estoque' : 'Esgotado'}
                  />
                </div>

                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-[11px] tracking-[0.15em] uppercase text-muted mb-2">
                    Cuidados com a peça
                  </p>
                  <p className="text-sm text-warm-gray font-light">{product.care}</p>
                </div>
              </div>
            </AnimateIn>
          </div>

          {related.length > 0 && (
            <section className="mt-20 lg:mt-28 pt-16 border-t border-border">
              <h2 className="heading-display text-2xl lg:text-3xl text-graphite mb-10 text-center">
                Você também pode gostar
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 sm:gap-y-10 lg:gap-x-6">
                {related.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3">
      <Icon className="w-4 h-4 text-silver-dark shrink-0 mt-0.5" strokeWidth={1.5} />
      <div>
        <p className="text-[10px] tracking-widest uppercase text-muted">{label}</p>
        <p className="text-sm font-light text-graphite">{value}</p>
      </div>
    </div>
  )
}
