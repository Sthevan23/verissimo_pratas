import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getStoreSettings } from '../services/storeService'
import { Button } from './ui/Button'
import { normalizeProductImageUrl } from '../services/remoteCatalog'

const DEFAULT_HERO_IMAGE =
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7459-jpg-ae93f851c77204047a17840546062480-640-0.webp'

export function Hero() {
  const settings = getStoreSettings()
  const heroImage = settings.heroImage
    ? normalizeProductImageUrl(settings.heroImage)
    : DEFAULT_HERO_IMAGE

  return (
    <section className="relative min-h-screen-safe lg:min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <motion.img
          src={heroImage}
          alt="Joias em prata Verissimo — elegância atemporal"
          className="w-full h-full object-cover object-center"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: [0.25, 0.1, 0.25, 1] }}
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-cream/90 via-cream/60 to-cream/30 lg:bg-gradient-to-r lg:from-cream/90 lg:via-cream/50 lg:to-transparent" />
      </div>

      <div className="container-brand relative z-10 py-16 sm:py-20 lg:py-32">
        <div className="max-w-xl lg:max-w-2xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[11px] tracking-[0.3em] uppercase text-muted mb-4 sm:mb-6"
          >
            Prata 925 · Garantia vitalícia
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="heading-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl text-graphite leading-[1.1] mb-4 sm:mb-6"
          >
            {settings.heroTitle || 'Elegância que permanece.'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm sm:text-base lg:text-lg text-warm-gray font-light leading-relaxed mb-8 sm:mb-10 max-w-md"
          >
            {settings.heroSubtitle ||
              'Descubra peças em prata pensadas para transformar momentos em memórias.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <Link to="/produtos" className="w-full sm:w-auto">
              <Button size="lg" className="w-full">
                Explorar coleção
              </Button>
            </Link>
            <Link to="/sobre" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full">
                Conheça a Verissimo
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
