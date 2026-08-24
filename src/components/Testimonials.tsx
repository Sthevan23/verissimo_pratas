import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { useState } from 'react'
import { testimonials } from '../data/testimonials'
import { AnimateIn } from './ui/AnimateIn'

export function Testimonials() {
  const [current, setCurrent] = useState(0)

  const next = () => setCurrent((c) => (c + 1) % testimonials.length)
  const prev = () =>
    setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)

  return (
    <section className="py-20 lg:py-28">
      <div className="container-brand">
        <AnimateIn className="text-center mb-14">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
            Depoimentos
          </p>
          <h2 className="heading-display text-3xl lg:text-4xl text-graphite">
            O que nossas clientes dizem
          </h2>
        </AnimateIn>

        {/* Desktop grid */}
        <div className="hidden lg:grid grid-cols-3 gap-6">
          {testimonials.slice(0, 3).map((t, i) => (
            <AnimateIn key={t.id} delay={i * 0.1}>
              <TestimonialCard testimonial={t} />
            </AnimateIn>
          ))}
        </div>

        {/* Mobile carousel */}
        <div className="lg:hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.4 }}
            >
              <TestimonialCard testimonial={testimonials[current]} />
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="p-2 border border-border hover:border-graphite transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    i === current ? 'bg-graphite' : 'bg-border'
                  }`}
                  aria-label={`Depoimento ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="p-2 border border-border hover:border-graphite transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function TestimonialCard({
  testimonial,
}: {
  testimonial: (typeof testimonials)[0]
}) {
  return (
    <div className="bg-off-white/60 p-8 lg:p-10 h-full flex flex-col">
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < testimonial.rating
                ? 'fill-graphite text-graphite'
                : 'text-border'
            }`}
            strokeWidth={1}
          />
        ))}
      </div>
      <p className="text-warm-gray font-light leading-relaxed flex-1 mb-6 italic">
        "{testimonial.text}"
      </p>
      <div>
        <p className="text-sm font-medium text-graphite">{testimonial.name}</p>
        {testimonial.location && (
          <p className="text-xs text-muted mt-0.5">{testimonial.location}</p>
        )}
      </div>
    </div>
  )
}
