import { Link } from 'react-router-dom'
import { categories } from '../data/categories'
import { AnimateIn } from './ui/AnimateIn'

export function Categories() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-brand">
        <AnimateIn className="text-center mb-14 lg:mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
            Explore
          </p>
          <h2 className="heading-display text-3xl lg:text-4xl text-graphite">
            Nossas categorias
          </h2>
        </AnimateIn>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-5">
          {categories.map((cat, i) => (
            <AnimateIn key={cat.slug} delay={i * 0.08}>
              <Link
                to={`/produtos?categoria=${cat.slug}`}
                className="group relative block aspect-[3/4] overflow-hidden bg-off-white"
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover image-zoom"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-graphite/0 group-hover:bg-graphite/20 transition-colors duration-500" />
                <div className="absolute inset-0 flex flex-col items-center justify-end p-5 lg:p-6">
                  <h3 className="font-serif text-xl lg:text-2xl text-cream font-light mb-2 drop-shadow-sm">
                    {cat.name}
                  </h3>
                  <span className="text-[10px] tracking-[0.2em] uppercase text-cream/80 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500">
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
