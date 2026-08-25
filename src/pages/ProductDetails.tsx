import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronDown,
  CreditCard,
  Heart,
  Minus,
  Plus,
  Share2,
  Truck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProductBySlug, getRelatedProducts } from '../data/products'
import { categoryLabels } from '../data/categories'
import { STORE_COMMERCE } from '../data/commerce'
import { useApp } from '../context/AppContext'
import {
  calcPixPrice,
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
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [shippingOpen, setShippingOpen] = useState(false)
  const [shareHint, setShareHint] = useState(false)

  useEffect(() => {
    if (product?.sizes?.length) {
      setSelectedSize(product.sizes[0])
    } else {
      setSelectedSize(undefined)
    }
    setQuantity(1)
    setSelectedImage(0)
    setPaymentOpen(false)
    setShippingOpen(false)
  }, [product?.id])

  if (!product) {
    return (
      <div className="header-offset container-brand py-32 text-center">
        <h1 className="heading-display text-3xl mb-4">Produto não encontrado</h1>
        <Button onClick={() => navigate('/produtos')}>Ver produtos</Button>
      </div>
    )
  }

  const listPrice = product.price
  const currentPrice = product.salePrice ?? product.price
  const pixPrice = calcPixPrice(currentPrice)
  const related = getRelatedProducts(product)
  const favorite = isFavorite(product.id)
  const categoryName = categoryLabels[product.category] ?? product.category
  const stock = product.stock
  const isLastPiece = product.inStock && stock !== undefined && stock === 1
  const isLowStock =
    product.inStock && stock !== undefined && stock > 1 && stock <= 3

  const handleAddToCart = () => {
    if (product.sizes && !selectedSize) return
    addToCart(product, quantity, selectedSize)
    openCart()
  }

  const handleShare = async () => {
    const url = window.location.href
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, url })
        return
      }
    } catch {
      /* user cancelled */
    }
    try {
      await navigator.clipboard.writeText(url)
      setShareHint(true)
      setTimeout(() => setShareHint(false), 2000)
    } catch {
      /* ignore */
    }
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

      <div className="header-offset pb-20 sm:pb-24">
        <div className="container-brand">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Gallery */}
            <AnimateIn direction="left">
              <div className="space-y-3">
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(product.id)
                    }}
                    className="absolute top-3 right-3 w-10 h-10 bg-cream/90 backdrop-blur-sm flex items-center justify-center border border-border/60"
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
                {product.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setSelectedImage(i)
                          setZoomed(false)
                        }}
                        className={cn(
                          'w-16 h-16 sm:w-20 sm:h-20 shrink-0 bg-off-white overflow-hidden border transition-colors',
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

            {/* Buy panel — Malena-style flow */}
            <AnimateIn direction="right" delay={0.1}>
              <div className="lg:sticky lg:top-[calc(var(--header-height)+1rem)]">
                <nav
                  className="text-[11px] sm:text-xs text-muted mb-4 leading-relaxed"
                  aria-label="Breadcrumb"
                >
                  <Link to="/" className="hover:text-graphite transition-colors">
                    Início
                  </Link>
                  <span className="mx-1.5">·</span>
                  <Link
                    to={`/produtos?categoria=${product.category}`}
                    className="hover:text-graphite transition-colors"
                  >
                    {categoryName}
                  </Link>
                  <span className="mx-1.5">·</span>
                  <span className="text-warm-gray">{product.name}</span>
                </nav>

                {product.badge && (
                  <span className="inline-block text-[10px] tracking-[0.2em] uppercase bg-graphite text-cream px-2.5 py-1 mb-3">
                    {product.badge === 'novidade'
                      ? 'Novidade'
                      : product.badge === 'oferta-especial'
                        ? 'Oferta especial'
                        : 'Promoção'}
                  </span>
                )}

                <h1 className="font-sans text-xl sm:text-2xl lg:text-[1.65rem] font-medium text-graphite leading-snug mb-5">
                  {product.name}
                </h1>

                {/* Pricing */}
                <div className="mb-4">
                  <p className="text-sm text-muted mb-0.5">
                    {formatPrice(listPrice)}
                  </p>
                  <p className="text-xl sm:text-2xl font-semibold text-graphite tracking-tight">
                    {formatPrice(pixPrice)}{' '}
                    <span className="text-base font-medium">com Pix</span>
                  </p>
                  <p className="text-sm text-warm-gray mt-1">
                    {formatInstallments(currentPrice)}
                  </p>
                  <button
                    type="button"
                    onClick={() => setPaymentOpen((o) => !o)}
                    className="mt-2 inline-flex items-center gap-1.5 text-sm text-graphite hover:underline"
                  >
                    <CreditCard className="w-4 h-4" strokeWidth={1.5} />
                    Ver mais detalhes
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        paymentOpen && 'rotate-180'
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                  <AnimatePresence>
                    {paymentOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-3 text-sm text-warm-gray font-light space-y-1.5 border border-border bg-off-white/60 px-4 py-3">
                          <li>
                            À vista no Pix: {formatPrice(pixPrice)} (
                            {STORE_COMMERCE.cashDiscountPercent}% off)
                          </li>
                          <li>
                            Cartão: até {STORE_COMMERCE.maxInstallments}x sem juros
                            de {formatPrice(currentPrice / STORE_COMMERCE.maxInstallments)}
                          </li>
                          <li>Preço de tabela: {formatPrice(currentPrice)}</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <p className="flex items-center gap-2 text-sm text-graphite mb-6">
                  <Truck className="w-4 h-4 shrink-0 text-silver-dark" strokeWidth={1.5} />
                  <span>
                    Frete grátis a partir de{' '}
                    {formatPrice(STORE_COMMERCE.freeShippingNationalMin)}
                  </span>
                </p>

                {/* Size select */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-4">
                    <label
                      htmlFor="product-size"
                      className="block text-sm font-medium text-graphite mb-2"
                    >
                      Tamanho
                    </label>
                    <div className="relative">
                      <select
                        id="product-size"
                        value={selectedSize ?? ''}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full appearance-none border border-border bg-cream px-4 py-3 pr-10 text-sm text-graphite focus:outline-none focus:border-graphite"
                      >
                        {product.sizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted"
                        strokeWidth={1.5}
                      />
                    </div>
                  </div>
                )}

                {(isLastPiece || isLowStock) && (
                  <p className="text-sm font-semibold text-graphite mb-4">
                    {isLastPiece
                      ? 'Atenção, última peça!'
                      : 'Atenção, últimas peças!'}
                  </p>
                )}

                {!product.inStock && (
                  <p className="text-sm font-semibold text-muted mb-4">Esgotado</p>
                )}

                {/* Qty + Comprar */}
                <div className="flex gap-2 sm:gap-3 mb-6">
                  <div className="inline-flex items-center border border-border shrink-0">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 sm:p-3.5 hover:bg-off-white transition-colors"
                      aria-label="Diminuir"
                    >
                      <Minus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                    <span className="min-w-[2rem] text-center text-sm tabular-nums">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setQuantity(
                          stock && stock > 0
                            ? Math.min(stock, quantity + 1)
                            : quantity + 1
                        )
                      }
                      className="p-3 sm:p-3.5 hover:bg-off-white transition-colors"
                      aria-label="Aumentar"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.5} />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    className="flex-1 !tracking-[0.12em]"
                    onClick={handleAddToCart}
                    disabled={!product.inStock || (product.sizes && !selectedSize)}
                  >
                    Comprar
                  </Button>
                </div>

                {/* Meios de envio */}
                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShippingOpen((o) => !o)}
                    className="w-full flex items-center justify-between py-4 text-sm text-graphite"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Truck className="w-4 h-4 text-silver-dark" strokeWidth={1.5} />
                      Meios de envio
                    </span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 text-muted transition-transform',
                        shippingOpen && 'rotate-180'
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                  <AnimatePresence>
                    {shippingOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="pb-4 text-sm text-warm-gray font-light space-y-2 pl-6">
                          <li>
                            Boa Esperança: frete grátis acima de{' '}
                            {formatPrice(STORE_COMMERCE.freeShippingLocalMin)}
                          </li>
                          <li>
                            Correios (Brasil): frete grátis acima de{' '}
                            {formatPrice(STORE_COMMERCE.freeShippingNationalMin)}
                          </li>
                          <li>Prazo estimado: {product.shippingDays}</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="w-full flex items-center gap-2 py-4 text-sm text-graphite hover:underline"
                  >
                    <Share2 className="w-4 h-4 text-silver-dark" strokeWidth={1.5} />
                    {shareHint ? 'Link copiado!' : 'Compartilhar'}
                  </button>
                </div>

                <div className="mt-6 pt-6 border-t border-border space-y-4">
                  <div>
                    <p className="text-[11px] tracking-[0.15em] uppercase text-muted mb-1.5">
                      Descrição
                    </p>
                    <p className="text-sm text-warm-gray font-light leading-relaxed">
                      {product.description}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p>
                      <span className="text-muted">Material · </span>
                      <span className="text-graphite font-light">{product.material}</span>
                    </p>
                    <p>
                      <span className="text-muted">Garantia · </span>
                      <span className="text-graphite font-light">{product.warranty}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] tracking-[0.15em] uppercase text-muted mb-1.5">
                      Cuidados
                    </p>
                    <p className="text-sm text-warm-gray font-light">{product.care}</p>
                  </div>
                </div>
              </div>
            </AnimateIn>
          </div>

          {related.length > 0 && (
            <section className="mt-16 lg:mt-24 pt-12 border-t border-border">
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
