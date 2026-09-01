import { Link } from 'react-router-dom'
import { HOME_CATEGORY_NAV } from '../data/categories'
import { AnimateIn } from './ui/AnimateIn'

export function Categories() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-cream">
      <div className="container-brand">
        <AnimateIn className="text-center mb-8 sm:mb-10">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
            Explore
          </p>
          <h2 className="heading-display text-2xl sm:text-3xl lg:text-4xl text-graphite">
            Nossas categorias
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3 max-w-4xl mx-auto">
          {HOME_CATEGORY_NAV.map((cat, i) => (
            <AnimateIn key={cat.slug} delay={i * 0.05}>
              <Link
                to={`/produtos?categoria=${cat.slug}`}
                className="flex items-center justify-center min-h-[52px] sm:min-h-[56px] px-3 py-3.5 bg-brand-green text-white text-[13px] sm:text-sm tracking-[0.12em] uppercase font-light text-center border border-brand-green hover:bg-[#6a7d52] active:opacity-95 transition-colors"
              >
                {cat.name}
              </Link>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
