import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getStoreFeaturedProducts, getStoreProducts } from '../services/storeService'
import { Button } from './ui/Button'
import { AnimateIn } from './ui/AnimateIn'
import { cn } from '../utils/format'

const FALLBACK = '/categories/colares.png'

function collectionSlides() {
  const featured = getStoreFeaturedProducts()
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, src: p.images[0] }))
    .filter((p) => Boolean(p.src))

  if (featured.length >= 3) return featured.slice(0, 8)

  const rest = getStoreProducts()
    .map((p) => ({ id: p.id, slug: p.slug, name: p.name, src: p.images[0] }))
    .filter((p) => Boolean(p.src) && !featured.some((f) => f.id === p.id))

  const slides = [...featured, ...rest].slice(0, 8)
  if (slides.length === 0) {
    return [{ id: 'fallback', slug: 'produtos', name: 'Coleção Verissimo', src: FALLBACK }]
  }
  return slides
}

export function FeaturedCollection() {
  const slides = collectionSlides()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const current = slides[index] ?? slides[0]

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 4000)
    return () => window.clearInterval(id)
  }, [slides.length, paused])

  return (
    <section className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[70vh]">
        <div
          className="relative overflow-hidden min-h-[50vh] lg:min-h-full bg-off-white"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {slides.map((slide, i) => (
            <Link
              key={slide.id}
              to={slide.slug === 'produtos' ? '/produtos' : `/produto/${slide.slug}`}
              className={cn(
                'absolute inset-0 block transition-opacity duration-700 ease-out',
                i === index ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
              )}
              aria-hidden={i !== index}
              tabIndex={i === index ? 0 : -1}
            >
              <img
                src={slide.src}
                alt={slide.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            </Link>
          ))}

          {slides.length > 1 ? (
            <div className="absolute bottom-5 left-1/2 z-[2] flex -translate-x-1/2 gap-2">
              {slides.map((slide, i) => (
                <button
                  key={`dot-${slide.id}`}
                  type="button"
                  aria-label={`Ver foto ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'
                  )}
                />
              ))}
            </div>
          ) : null}

          <p className="sr-only">
            {current?.name}
          </p>
        </div>

        <div className="flex items-center bg-off-white px-8 py-16 lg:px-16 lg:py-24">
          <AnimateIn className="max-w-md">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-4">
              Coleção exclusiva
            </p>
            <h2 className="heading-display text-3xl lg:text-5xl text-graphite leading-tight mb-6">
              Peças para contar a sua história.
            </h2>
            <p className="text-warm-gray font-light leading-relaxed mb-10 text-base lg:text-lg">
              Cada joia Verissimo é pensada para acompanhar seus momentos mais
              significativos — da rotina ao extraordinário.
            </p>
            <Link to="/produtos">
              <Button size="lg">Descobrir coleção</Button>
            </Link>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
