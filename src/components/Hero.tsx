import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getStoreSettings } from '../services/storeService'
import { Button } from './ui/Button'

export function Hero() {
  const settings = getStoreSettings()

  return (
    <section className="relative flex items-center overflow-hidden bg-brand-green text-white">
      <div className="container-brand relative z-10 py-14 sm:py-20 lg:py-28">
        <div className="max-w-xl lg:max-w-2xl mx-auto lg:mx-0 text-center lg:text-left">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-[11px] tracking-[0.3em] uppercase text-white/80 mb-4 sm:mb-6"
          >
            Prata 925 · Garantia vitalícia
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="heading-display text-3xl sm:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.1] mb-4 sm:mb-6"
          >
            {settings.heroTitle || 'Elegância que permanece.'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm sm:text-base lg:text-lg text-white/90 font-light leading-relaxed mb-8 sm:mb-10 max-w-md mx-auto lg:mx-0"
          >
            {settings.heroSubtitle ||
              'Descubra peças em prata pensadas para transformar momentos em memórias.'}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="flex justify-center lg:justify-start"
          >
            <Link to="/produtos" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full !bg-white !text-[#4a5a38] !border-white hover:!bg-off-white hover:!text-[#3d4a30]"
              >
                Explorar coleção
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
