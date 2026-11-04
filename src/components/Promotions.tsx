import { Link } from 'react-router-dom'
import { getSaleProducts } from '../data/products'
import { AnimateIn } from './ui/AnimateIn'
import { ProductCard } from './ProductCard'
import { ProductGridCell } from './ProductGridCell'

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

        <div className="product-grid product-grid-3 mx-auto max-w-5xl">
          {saleProducts.map((product, i) => (
            <ProductGridCell key={product.id}>
              <ProductCard product={product} index={i} />
            </ProductGridCell>
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
