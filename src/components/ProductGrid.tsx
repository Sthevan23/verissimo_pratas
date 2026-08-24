import { Link } from 'react-router-dom'
import type { Product } from '../types'
import { AnimateIn } from './ui/AnimateIn'
import { ProductCard } from './ProductCard'

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
    <section className="py-20 lg:py-28">
      <div className="container-brand">
        <AnimateIn className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12 lg:mb-14">
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-10 lg:gap-x-6 lg:gap-y-12">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
