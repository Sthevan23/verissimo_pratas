import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Button } from './ui/Button'
import { AnimateIn } from './ui/AnimateIn'

const COLLECTION_IMAGE =
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4633-9c3c043dc188f7692c17807857126302-640-0.webp'

export function FeaturedCollection() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const y = useTransform(scrollYProgress, [0, 1], ['-5%', '5%'])

  return (
    <section ref={ref} className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[70vh]">
        <div className="relative overflow-hidden min-h-[50vh] lg:min-h-full">
          <motion.img
            style={{ y }}
            src={COLLECTION_IMAGE}
            alt="Coleção Verissimo — peças para contar a sua história"
            className="absolute inset-0 w-full h-[110%] object-cover"
            loading="lazy"
          />
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
