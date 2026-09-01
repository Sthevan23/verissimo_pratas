import { Link } from 'react-router-dom'
import { getHomeCategories } from '../services/storeService'
import { AnimateIn } from './ui/AnimateIn'

export function Categories() {
  const homeCategories = getHomeCategories()

  return (
    <section className="py-14 sm:py-20 lg:py-28">
      <div className="container-brand">
        <AnimateIn className="text-center mb-10 sm:mb-14 lg:mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
            Explore
          </p>
          <h2 className="heading-display text-2xl sm:text-3xl lg:text-4xl text-graphite">
            Nossas categorias
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3 lg:gap-5">
          {homeCategories.map((cat, i) => (
            <AnimateIn key={cat.slug} delay={i * 0.08}>
              <Link
                to={`/produtos?categoria=${cat.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden bg-off-white active:opacity-95"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover image-zoom"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-graphite/15 lg:bg-graphite/0 lg:group-hover:bg-graphite/20 transition-colors duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-4 sm:p-5 lg:p-6">
                  <h3 className="font-serif text-lg sm:text-xl lg:text-2xl text-cream font-light mb-1 sm:mb-2 drop-shadow-sm text-center">
                    {cat.name}
                  </h3>
                  <span className="text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-cream/90 lg:text-cream/80 opacity-100 lg:opacity-0 lg:translate-y-2 lg:group-hover:opacity-100 lg:group-hover:translate-y-0 transition-all duration-500">
                    Explorar →
                  </span>
                </div>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
