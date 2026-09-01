import { Helmet } from 'react-helmet-async'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  ChevronDown,
  CreditCard,
  Minus,
  Plus,
  Share2,
  Truck,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { getProductBySlug, getRelatedProducts } from '../data/products'
import { categoryLabels } from '../data/categories'
import { STORE_COMMERCE } from '../data/commerce'
import { resolveProductSizes } from '../data/sizes'
import { useApp } from '../context/AppContext'
import {
  calcPixPrice,
  cn,
  formatInstallments,
  formatPrice,
} from '../utils/format'
import { ProductCard } from '../components/ProductCard'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Button } from '../components/ui/Button'

export function ProductDetails() {
  const { slug } = useParams<{ slug: string }>()
  const product = slug ? getProductBySlug(slug) : undefined
  const navigate = useNavigate()
  const { addToCart, openCart } = useApp()
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [selectedSize, setSelectedSize] = useState<string | undefined>()
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({})
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [shippingOpen, setShippingOpen] = useState(false)
  const [shareHint, setShareHint] = useState(false)

  useEffect(() => {
    const nextSizes = product
      ? resolveProductSizes(product.category, product.sizes)
      : undefined
    if (nextSizes?.length) {
      setSelectedSize(nextSizes[0])
    } else {
      setSelectedSize(undefined)
    }
    const defaults: Record<string, string> = {}
    product?.options?.forEach((opt) => {
      if (opt.values[0]) defaults[opt.id] = opt.values[0]
    })
    setSelectedChoices(defaults)
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
  const categoryName = categoryLabels[product.category] ?? product.category
  const sizes = resolveProductSizes(product.category, product.sizes)
  const options = product.options?.filter((o) => o.values.length > 0) ?? []
  const optionsComplete =
    options.length === 0 || options.every((o) => Boolean(selectedChoices[o.id]))
  const stock = product.stock
  const isLastPiece = product.inStock && stock !== undefined && stock === 1
  const isLowStock =
    product.inStock && stock !== undefined && stock > 1 && stock <= 3

  const handleBuy = () => {
    if (sizes?.length && !selectedSize) return
    if (!optionsComplete) return
    addToCart(product, quantity, {
      size: selectedSize,
      choices: Object.keys(selectedChoices).length ? selectedChoices : undefined,
    })
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
      /* cancelled */
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

      <div className="header-offset bg-cream pb-24">
        {/* Galeria — mobile full bleed como Nuvemshop/Mafena */}
        <AnimateIn>
          <div className="lg:hidden">
            <div className="relative aspect-square bg-off-white overflow-hidden">
              <motion.img
                key={selectedImage}
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              />
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      'w-14 h-14 shrink-0 overflow-hidden border',
                      i === selectedImage ? 'border-graphite' : 'border-border'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </AnimateIn>

        <div className="container-brand">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 lg:pt-8">
            {/* Galeria desktop */}
            <AnimateIn direction="left" className="hidden lg:block">
              <div className="space-y-3">
                <div className="relative aspect-square bg-off-white overflow-hidden">
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {product.images.length > 1 && (
                  <div className="flex gap-2">
                    {product.images.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImage(i)}
                        className={cn(
                          'w-20 h-20 shrink-0 overflow-hidden border',
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

            {/* Painel de compra — igual à estrutura da foto Mafena */}
            <AnimateIn direction="right" delay={0.05}>
              <div className="pt-4 lg:pt-0 lg:sticky lg:top-[calc(var(--header-height)+1rem)] max-w-xl">
                <nav
                  className="text-[12px] text-muted mb-3 leading-relaxed"
                  aria-label="Breadcrumb"
                >
                  <Link to="/" className="hover:text-graphite">
                    Início
                  </Link>
                  <span className="mx-1.5">·</span>
                  <Link
                    to={`/produtos?categoria=${product.category}`}
                    className="hover:text-graphite"
                  >
                    {categoryName}
                  </Link>
                  <span className="mx-1.5">·</span>
                  <span className="text-warm-gray">{product.name}</span>
                </nav>

                <h1 className="font-sans text-[1.35rem] sm:text-2xl font-semibold text-charcoal leading-snug mb-4">
                  {product.name}
                </h1>

                {/* Preços */}
                <div className="mb-3">
                  <p className="text-[15px] text-muted line-through decoration-muted/80">
                    {formatPrice(listPrice)}
                  </p>
                  <p className="text-[1.35rem] sm:text-2xl font-bold text-graphite leading-tight mt-0.5">
                    {formatPrice(pixPrice)}{' '}
                    <span className="font-semibold text-[1.05rem] sm:text-xl">
                      com Pix
                    </span>
                  </p>
                  <p className="text-[15px] text-charcoal/80 mt-1 font-medium">
                    {formatInstallments(currentPrice)}
                  </p>

                  <button
                    type="button"
                    onClick={() => setPaymentOpen((o) => !o)}
                    className="mt-2.5 inline-flex items-center gap-1.5 text-[14px] text-charcoal"
                  >
                    <CreditCard className="w-[15px] h-[15px]" strokeWidth={1.75} />
                    Ver mais detalhes
                  </button>

                  <AnimatePresence>
                    {paymentOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-3 text-sm text-warm-gray space-y-1.5 bg-off-white border border-border px-4 py-3">
                          <li>
                            À vista no Pix: {formatPrice(pixPrice)} (
                            {STORE_COMMERCE.cashDiscountPercent}% off)
                          </li>
                          <li>
                            Cartão: até {STORE_COMMERCE.maxInstallments} x de{' '}
                            {formatPrice(currentPrice / STORE_COMMERCE.maxInstallments)}{' '}
                            sem juros
                          </li>
                          <li>Preço: {formatPrice(currentPrice)}</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {sizes && sizes.length > 0 && (
                  <div className="mb-3">
                    <label
                      htmlFor="product-size"
                      className="block text-[14px] text-charcoal mb-2"
                    >
                      Tamanho
                    </label>
                    <div className="relative">
                      <select
                        id="product-size"
                        value={selectedSize ?? ''}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full appearance-none border border-border bg-cream rounded-sm px-3.5 py-3 pr-10 text-[15px] text-charcoal focus:outline-none focus:border-graphite"
                      >
                        {sizes.map((size) => (
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

                {options.map((opt) => (
                  <div key={opt.id} className="mb-3">
                    <p className="block text-[14px] text-charcoal mb-2">{opt.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {opt.values.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() =>
                            setSelectedChoices((prev) => ({ ...prev, [opt.id]: value }))
                          }
                          className={cn(
                            'px-3 py-2.5 text-[13px] border rounded-sm transition-colors text-left',
                            selectedChoices[opt.id] === value
                              ? 'border-graphite bg-graphite text-cream'
                              : 'border-border text-charcoal hover:border-graphite bg-cream'
                          )}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                {(isLastPiece || isLowStock) && (
                  <p className="text-[15px] font-bold text-graphite mb-3">
                    {isLastPiece
                      ? 'Atenção, última peça!'
                      : 'Atenção, últimas peças!'}
                  </p>
                )}

                {!product.inStock && (
                  <p className="text-[15px] font-bold text-muted mb-3">Esgotado</p>
                )}

                {/* Quantidade + Comprar */}
                <div className="flex items-stretch gap-2.5 mb-2">
                  <div className="inline-flex items-center border border-border rounded-sm shrink-0 bg-cream">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-11 h-[48px] flex items-center justify-center text-charcoal"
                      aria-label="Diminuir"
                    >
                      <Minus className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                    <span className="w-8 text-center text-[15px] tabular-nums text-charcoal">
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
                      className="w-11 h-[48px] flex items-center justify-center text-charcoal"
                      aria-label="Aumentar"
                    >
                      <Plus className="w-4 h-4" strokeWidth={1.75} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleBuy}
                    disabled={
                      !product.inStock ||
                      (Boolean(sizes?.length) && !selectedSize) ||
                      !optionsComplete
                    }
                    className="flex-1 h-[48px] bg-graphite text-cream text-[15px] font-semibold tracking-wide hover:bg-charcoal disabled:opacity-45 disabled:cursor-not-allowed transition-colors"
                  >
                    Comprar
                  </button>
                </div>

                {/* Meios de envio */}
                <div className="mt-4 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShippingOpen((o) => !o)}
                    className="w-full flex items-center justify-between py-3.5 text-[14px] text-charcoal"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Truck className="w-4 h-4" strokeWidth={1.75} />
                      Meios de envio
                    </span>
                    <Plus
                      className={cn(
                        'w-4 h-4 text-muted transition-transform',
                        shippingOpen && 'rotate-45'
                      )}
                      strokeWidth={1.75}
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
                        <ul className="pb-4 text-sm text-warm-gray space-y-2 pl-6">
                          <li>
                            Boa Esperança: frete grátis acima de{' '}
                            {formatPrice(STORE_COMMERCE.freeShippingLocalMin)}
                          </li>
                          <li>
                            Correios: frete grátis acima de{' '}
                            {formatPrice(STORE_COMMERCE.freeShippingNationalMin)}
                          </li>
                          <li>Prazo: {product.shippingDays}</li>
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-border">
                  <button
                    type="button"
                    onClick={handleShare}
                    className="flex items-center gap-2 py-3.5 text-[14px] text-charcoal"
                  >
                    <Share2 className="w-4 h-4" strokeWidth={1.75} />
                    {shareHint ? 'Link copiado!' : 'Compartilhar'}
                  </button>
                </div>

                <div className="mt-6 pt-5 border-t border-border space-y-4">
                  <p className="text-sm text-warm-gray font-light leading-relaxed">
                    {product.description}
                  </p>
                  <p className="text-sm text-warm-gray">
                    <span className="text-muted">Material · </span>
                    {product.material}
                  </p>
                  <p className="text-sm text-warm-gray">
                    <span className="text-muted">Garantia · </span>
                    {product.warranty}
                  </p>
                </div>
              </div>
            </AnimateIn>
          </div>

          {related.length > 0 && (
            <section className="mt-14 lg:mt-20 pt-10 border-t border-border">
              <h2 className="heading-display text-2xl lg:text-3xl text-graphite mb-8 text-center">
                Você também pode gostar
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-8 sm:gap-x-4 lg:gap-x-6">
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
