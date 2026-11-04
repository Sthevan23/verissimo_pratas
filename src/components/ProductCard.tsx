import { Heart, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import type { Product } from '../types'
import { catalogCardImageUrl } from '../utils/catalogImage'
import {
  calcDiscount,
  cn,
  formatInstallments,
  formatPrice,
} from '../utils/format'
import { productRequiresSelection } from '../utils/cart'
import { productPath } from '../utils/productPath'

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
  const primarySrc = useMemo(
    () => (imgSrc ? catalogCardImageUrl(imgSrc) : ''),
    [imgSrc]
  )
  const hoverSrc = useMemo(
    () => (product.images[1] ? catalogCardImageUrl(product.images[1]) : ''),
    [product.images]
  )

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
      className="group flex h-full min-w-0 flex-col"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative mb-3 aspect-[3/4] shrink-0 overflow-hidden bg-off-white sm:mb-4">
        <Link to={productPath(product)} className="absolute inset-0 block">
          {!imgBroken && primarySrc ? (
            <img
              src={primarySrc}
              alt={product.name}
              width={480}
              height={640}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
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
          {hovered && hasSecondImage && hoverSrc ? (
            <img
              src={hoverSrc}
              alt=""
              width={480}
              height={640}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="absolute inset-0 z-0 w-full h-full object-cover transition-opacity duration-300 hidden lg:block opacity-100"
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
              to={productPath(product)}
              className="w-full flex items-center justify-center gap-2 bg-graphite/80 text-cream py-3 text-[10px] tracking-[0.2em] uppercase"
            >
              Esgotado
            </Link>
          ) : needsSelection ? (
            <Link
              to={productPath(product)}
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

      <div className="flex min-h-0 flex-1 flex-col pt-0.5">
        <Link to={productPath(product)} className="mb-1 block min-w-0">
          <h3 className="product-card__title text-xs font-light text-graphite transition-colors hover:text-charcoal sm:text-sm">
            {product.name}
          </h3>
        </Link>

        <div className="product-card__price">
          {product.salePrice ? (
            <div className="flex h-full min-w-0 flex-col justify-center gap-0.5">
              <div className="flex min-w-0 items-baseline gap-x-1.5 overflow-hidden">
                <span className="shrink-0 text-xs text-muted line-through sm:text-sm">
                  {formatPrice(product.price)}
                </span>
                <span className="truncate text-xs font-medium text-graphite sm:text-sm">
                  {formatPrice(product.salePrice)}
                </span>
              </div>
              <span className="text-[9px] text-silver-dark sm:text-[10px]">
                -{calcDiscount(product.price, product.salePrice)}%
              </span>
            </div>
          ) : (
            <div className="flex h-full items-center">
              <span className="text-xs font-medium text-graphite sm:text-sm">
                {formatPrice(product.price)}
              </span>
            </div>
          )}
        </div>

        <p className="product-card__installments text-[10px] font-light text-muted sm:text-[11px]">
          {formatInstallments(currentPrice)}
        </p>

        <div className="mt-2 shrink-0 lg:hidden">
          {!product.inStock ? (
            <Link
              to={productPath(product)}
              className="flex min-h-11 w-full items-center justify-center border border-border py-2.5 text-[10px] tracking-[0.2em] uppercase text-muted"
            >
              Esgotado
            </Link>
          ) : needsSelection ? (
            <Link
              to={productPath(product)}
              className="flex min-h-11 w-full items-center justify-center border border-border py-2.5 text-[10px] tracking-[0.2em] uppercase text-graphite transition-colors active:border-graphite active:bg-off-white"
            >
              Escolher opções
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleBuy}
              className="min-h-11 w-full border border-border py-2.5 text-[10px] tracking-[0.2em] uppercase text-graphite transition-colors active:border-graphite active:bg-off-white"
            >
              Comprar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
