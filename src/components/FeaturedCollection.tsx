import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHomeShowcasePhotos } from '../services/storeService'
import { Button } from './ui/Button'
import { AnimateIn } from './ui/AnimateIn'
import { cn } from '../utils/format'

const FALLBACK = '/categories/colares.png'

export function FeaturedCollection() {
  const slidesRaw = getHomeShowcasePhotos('collection', 8)
  const slides =
    slidesRaw.length > 0
      ? slidesRaw
      : [{ id: 'fallback', slug: 'produtos', name: 'Coleção Verissimo', src: FALLBACK }]
  const slidesKey = slides.map((s) => s.id).join('|')
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const current = slides[index] ?? slides[0]

  useEffect(() => {
    setIndex(0)
  }, [slidesKey])

  useEffect(() => {
    if (slides.length < 2 || paused) return
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [slides.length, paused])

  const goTo = (next: number) => {
    setIndex(((next % slides.length) + slides.length) % slides.length)
  }

  return (
    <section className="relative overflow-hidden bg-off-white">
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_1.15fr] min-h-[58vh] lg:min-h-[62vh]">
        <div
          className="relative flex items-center justify-center px-6 py-10 sm:px-10 lg:px-12 lg:py-14"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative w-full max-w-[420px] lg:max-w-[460px] aspect-[4/5] overflow-hidden bg-cream shadow-[0_24px_60px_rgba(26,26,26,0.14)] ring-1 ring-black/5">
            {slides.map((slide, i) => {
              const active = i === index
              return (
                <div
                  key={slide.id}
                  className={cn(
                    'absolute inset-0 transition-opacity duration-700 ease-out',
                    active ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
                  )}
                  aria-hidden={!active}
                >
                  <img
                    src={slide.src}
                    alt={slide.name}
                    className={cn(
                      'absolute inset-0 h-full w-full object-cover transition-transform duration-[4500ms] ease-out',
                      active ? 'scale-105' : 'scale-100'
                    )}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-graphite/25 via-transparent to-transparent pointer-events-none" />
                </div>
              )
            })}

            {current && current.slug !== 'produtos' ? (
              <Link
                to={`/produto/${current.slug}`}
                className="absolute inset-0 z-[2]"
                aria-label={`Ver ${current.name}`}
              />
            ) : null}

            {slides.length > 1 ? (
              <div className="absolute bottom-4 left-1/2 z-[3] flex -translate-x-1/2 items-center gap-2 rounded-full bg-graphite/25 px-3 py-1.5 backdrop-blur-sm">
                {slides.map((slide, i) => (
                  <button
                    key={`dot-${slide.id}`}
                    type="button"
                    aria-label={`Ver foto ${i + 1}`}
                    aria-current={i === index}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      goTo(i)
                    }}
                    className={cn(
                      'h-1.5 rounded-full transition-all duration-300',
                      i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/85'
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center px-8 py-14 lg:px-16 lg:py-20">
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
              <Button type="button" size="lg">
                Descobrir coleção
              </Button>
            </Link>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
