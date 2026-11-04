import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { AnimateIn } from './ui/AnimateIn'
import { ProductCard } from './ProductCard'
import { ProductGridCell } from './ProductGridCell'

interface ProductGridProps {
  products: Product[]
  title?: string
  subtitle?: string
  viewAllHref?: string
}

export function ProductGrid({
  products,
  title = 'Mais desejados',
  subtitle = 'As peças preferidas das nossas clientes',
  viewAllHref = '/produtos',
}: ProductGridProps) {
  return (
    <section className="py-14 sm:py-20 lg:py-28">
      <div className="container-brand">
        <AnimateIn className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 sm:mb-12 lg:mb-14">
          <div>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
              Seleção especial
            </p>
            <h2 className="heading-display text-3xl lg:text-4xl text-graphite">
              {title}
            </h2>
            {subtitle && (
              <p className="text-warm-gray font-light mt-2 text-sm lg:text-base">
                {subtitle}
              </p>
            )}
          </div>
          <Link
            to={viewAllHref}
            className="text-[11px] tracking-[0.2em] uppercase text-graphite link-underline shrink-0"
          >
            Ver todos
          </Link>
        </AnimateIn>

        <div className="product-grid">
          {products.map((product, i) => (
            <ProductGridCell key={product.id}>
              <ProductCard product={product} index={i} />
            </ProductGridCell>
          ))}
        </div>
      </div>
    </section>
  )
}
