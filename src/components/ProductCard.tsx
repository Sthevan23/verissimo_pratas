import { Heart, ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Product } from '../types'
import {
  calcDiscount,
  cn,
  formatInstallments,
  formatPrice,
} from '../utils/format'
import { productRequiresSelection } from '../utils/cart'

interface ProductCardProps {
  product: Product
  index?: number
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addToCart, toggleFavorite, isFavorite } = useApp()
  const [hovered, setHovered] = useState(false)
  const [imgBroken, setImgBroken] = useState(false)
  const [imgSrc, setImgSrc] = useState(product.images[0] || '')
  const favorite = isFavorite(product.id)
  const currentPrice = product.salePrice ?? product.price
  const hasSecondImage = product.images.length > 1 && !imgBroken
  const needsSelection = productRequiresSelection(product)

  useEffect(() => {
    setImgSrc(product.images[0] || '')
    setImgBroken(false)
  }, [product.id, product.images])

  const handleBuy = () => {
    if (!product.inStock) return
    if (needsSelection) return
    addToCart(product)
  }

  const handleImgError = () => {
    const original = product.images[0]
    if (original && !imgSrc.includes('retry=1') && original.includes('media.php')) {
      const join = original.includes('?') ? '&' : '?'
      setImgSrc(`${original}${join}retry=1`)
      return
    }
    setImgBroken(true)
  }

  return (
    <article
      className="group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[3/4] bg-off-white overflow-hidden mb-3 sm:mb-4">
        <Link to={`/produto/${product.slug}`} className="absolute inset-0 block">
          {!imgBroken && imgSrc ? (
            <img
              src={imgSrc}
              alt={product.name}
              width={480}
              height={640}
              className={cn(
                'absolute inset-0 z-0 w-full h-full object-cover transition-opacity duration-300',
                !product.inStock && 'opacity-60',
                hovered && hasSecondImage ? 'lg:opacity-0' : 'opacity-100'
              )}
              loading={index < 8 ? 'eager' : 'lazy'}
              decoding="async"
              fetchPriority={index < 4 ? 'high' : 'auto'}
              onError={handleImgError}
            />
          ) : (
            <div className="absolute inset-0 z-0 flex items-center justify-center bg-off-white text-muted text-[10px] tracking-widest uppercase px-4 text-center">
              Foto indisponível
            </div>
          )}
          {hasSecondImage ? (
            <img
              src={product.images[1]}
              alt=""
              width={480}
              height={640}
              className={cn(
                'absolute inset-0 z-0 w-full h-full object-cover transition-opacity duration-300 hidden lg:block',
                hovered ? 'opacity-100' : 'opacity-0'
              )}
              loading="lazy"
              decoding="async"
            />
          ) : null}
        </Link>

        {!product.inStock ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-graphite text-cream text-[8px] sm:text-[9px] tracking-[0.15em] uppercase px-2 py-1 sm:px-3 sm:py-1.5">
            Esgotado
          </span>
        ) : product.badge ? (
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 bg-brand-green text-white text-[8px] sm:text-[9px] tracking-[0.15em] uppercase px-2 py-1 sm:px-3 sm:py-1.5">
            {product.badge === 'novidade'
              ? 'Novidade'
              : product.badge === 'oferta-especial'
                ? 'Oferta especial'
                : 'Promoção'}
          </span>
        ) : null}

        <button
          type="button"
          onClick={() => toggleFavorite(product.id)}
          className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 touch-target bg-cream/80 backdrop-blur-sm hover:bg-cream active:bg-cream transition-colors"
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart
            className={cn(
              'w-4 h-4 transition-colors',
              favorite ? 'fill-graphite text-graphite' : 'text-graphite'
            )}
            strokeWidth={1.5}
          />
        </button>

        <div className="absolute bottom-0 left-0 right-0 z-10 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden lg:block">
          {!product.inStock ? (
            <Link
              to={`/produto/${product.slug}`}
              className="w-full flex items-center justify-center gap-2 bg-graphite/80 text-cream py-3 text-[10px] tracking-[0.2em] uppercase"
            >
              Esgotado
            </Link>
          ) : needsSelection ? (
            <Link
              to={`/produto/${product.slug}`}
              className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-3 text-[10px] tracking-[0.2em] uppercase hover:bg-brand-green-dark transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} />
              Escolher opções
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              className="w-full flex items-center justify-center gap-2 bg-brand-green text-white py-3 text-[10px] tracking-[0.2em] uppercase hover:bg-brand-green-dark transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" strokeWidth={1.5} />
              Comprar
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1 sm:space-y-1.5">
        <Link to={`/produto/${product.slug}`}>
          <h3 className="text-xs sm:text-sm font-light text-graphite leading-snug hover:text-charcoal transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
          {product.salePrice ? (
            <>
              <span className="text-xs sm:text-sm text-muted line-through">
                {formatPrice(product.price)}
              </span>
              <span className="text-xs sm:text-sm font-medium text-graphite">
                {formatPrice(product.salePrice)}
              </span>
              <span className="text-[9px] sm:text-[10px] text-silver-dark">
                -{calcDiscount(product.price, product.salePrice)}%
              </span>
            </>
          ) : (
            <span className="text-xs sm:text-sm font-medium text-graphite">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <p className="text-[10px] sm:text-[11px] text-muted font-light">
          {formatInstallments(currentPrice)}
        </p>

        {!product.inStock ? (
          <Link
            to={`/produto/${product.slug}`}
            className="lg:hidden w-full mt-2 min-h-11 py-2.5 border border-border text-[10px] tracking-[0.2em] uppercase text-muted flex items-center justify-center"
          >
            Esgotado
          </Link>
        ) : needsSelection ? (
          <Link
            to={`/produto/${product.slug}`}
            className="lg:hidden w-full mt-2 min-h-11 py-2.5 border border-border text-[10px] tracking-[0.2em] uppercase text-graphite active:border-graphite active:bg-off-white transition-colors flex items-center justify-center"
          >
            Escolher opções
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleBuy}
            className="lg:hidden w-full mt-2 min-h-11 py-2.5 border border-border text-[10px] tracking-[0.2em] uppercase text-graphite active:border-graphite active:bg-off-white transition-colors"
          >
            Comprar
          </button>
        )}
      </div>
    </article>
  )
}
