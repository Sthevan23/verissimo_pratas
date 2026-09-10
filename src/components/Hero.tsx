import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { getHomeShowcasePhotos, getStoreSettings } from '../services/storeService'
import { Button } from './ui/Button'

function heroProductImages() {
  return getHomeShowcasePhotos('hero', 10)
}

function HeroPhotoParade() {
  const photos = heroProductImages()
  if (photos.length === 0) return null

  // Duplica a faixa para o loop CSS ficar contínuo
  const track = [...photos, ...photos]

  return (
    <div
      className="pointer-events-none absolute inset-y-0 right-0 hidden w-[52%] overflow-hidden lg:block"
      aria-hidden
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-green via-brand-green/40 to-transparent z-10 w-28" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-brand-green to-transparent z-10" />

      <div className="hero-photo-marquee flex h-full items-center gap-6 pl-8">
        {track.map((photo, i) => {
          const tilt = i % 2 === 0 ? '-rotate-6' : 'rotate-5'
          const offset = i % 3 === 0 ? 'mt-10' : i % 3 === 1 ? '-mt-6' : 'mt-2'
          return (
            <Link
              key={`${photo.id}-${i}`}
              to={`/produto/${photo.slug}`}
              className={`pointer-events-auto relative shrink-0 w-[150px] xl:w-[180px] aspect-[3/4] ${offset} ${tilt} transition-transform duration-500 hover:rotate-0 hover:scale-[1.04] hover:z-20`}
              tabIndex={-1}
            >
              <img
                src={photo.src}
                alt=""
                width={180}
                height={240}
                loading={i < 4 ? 'eager' : 'lazy'}
                decoding="async"
                className="h-full w-full object-cover shadow-[0_18px_40px_rgba(0,0,0,0.28)] ring-1 ring-white/25"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/** Faixa compacta no mobile — fotos tombadas passando sob o texto */
function HeroPhotoStripMobile() {
  const photos = heroProductImages().slice(0, 8)
  if (photos.length === 0) return null
  const track = [...photos, ...photos]

  return (
    <div className="relative mt-10 -mx-4 overflow-hidden lg:hidden" aria-hidden>
      <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-brand-green to-transparent z-10" />
      <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-brand-green to-transparent z-10" />
      <div className="hero-photo-marquee-mobile flex items-end gap-4 px-4 pb-1">
        {track.map((photo, i) => {
          const tilt = i % 2 === 0 ? '-rotate-6' : 'rotate-4'
          return (
            <Link
              key={`m-${photo.id}-${i}`}
              to={`/produto/${photo.slug}`}
              className={`shrink-0 w-[92px] aspect-[3/4] ${tilt} transition-transform duration-400 hover:rotate-0`}
              tabIndex={-1}
            >
              <img
                src={photo.src}
                alt=""
                width={92}
                height={122}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover shadow-[0_12px_28px_rgba(0,0,0,0.25)] ring-1 ring-white/20"
              />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export function Hero() {
  const settings = getStoreSettings()

  return (
    <section className="relative flex items-center overflow-hidden bg-brand-green text-white">
      <HeroPhotoParade />

      <div className="container-brand relative z-10 py-14 sm:py-20 lg:py-28">
        <div className="max-w-xl lg:max-w-lg xl:max-w-xl mx-auto lg:mx-0 text-center lg:text-left">
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

          <HeroPhotoStripMobile />
        </div>
      </div>
    </section>
  )
}
