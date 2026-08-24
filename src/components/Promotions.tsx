import { Link } from 'react-router-dom'
import { getSaleProducts } from '../data/products'
import { AnimateIn } from './ui/AnimateIn'
import { ProductCard } from './ProductCard'

export function Promotions() {
  const saleProducts = getSaleProducts()

  if (saleProducts.length === 0) return null

  return (
    <section className="py-20 lg:py-28 bg-off-white/60">
      <div className="container-brand">
        <AnimateIn className="text-center mb-14">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
            Oportunidades
          </p>
          <h2 className="heading-display text-3xl lg:text-4xl text-graphite">
            Ofertas especiais
          </h2>
          <p className="text-warm-gray font-light mt-3 max-w-md mx-auto">
            Peças selecionadas com condições exclusivas por tempo limitado.
          </p>
        </AnimateIn>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-10 lg:gap-x-8 lg:gap-y-12 max-w-5xl mx-auto">
          {saleProducts.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        <AnimateIn className="text-center mt-12">
          <Link
            to="/produtos?promocao=true"
            className="text-[11px] tracking-[0.2em] uppercase text-graphite link-underline"
          >
            Ver todas as ofertas
          </Link>
        </AnimateIn>
      </div>
    </section>
  )
}
