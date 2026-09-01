import { InstagramIcon } from './ui/SocialIcons'
import { AnimateIn } from './ui/AnimateIn'
import { STORE_CONTACT } from '../data/contact'

const instagramImages = [
  '/categories/aneis.png',
  '/categories/pulseiras.png',
  '/categories/colares.png',
  '/categories/brincos.png',
  '/categories/conjuntos.png',
  '/categories/braceletes.png',
]

export function InstagramFeed() {
  return (
    <section className="py-20 lg:py-28 bg-off-white/40">
      <div className="container-brand">
        <AnimateIn className="text-center mb-12">
          <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
            Redes sociais
          </p>
          <h2 className="heading-display text-3xl lg:text-4xl text-graphite mb-4">
            Siga a Verissimo
          </h2>
          <a
            href={STORE_CONTACT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-graphite transition-colors link-underline"
          >
            <InstagramIcon className="w-4 h-4" />
            {STORE_CONTACT.instagramHandle}
          </a>
        </AnimateIn>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 lg:gap-2">
          {instagramImages.map((img, i) => (
            <AnimateIn key={i} delay={i * 0.05}>
              <a
                href={STORE_CONTACT.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block aspect-square overflow-hidden bg-off-white"
              >
                <img
                  src={img}
                  alt={`Verissimo Pratas no Instagram — foto ${i + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-graphite/0 group-hover:bg-graphite/30 transition-colors duration-500 flex items-center justify-center">
                  <InstagramIcon className="w-6 h-6 text-cream opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </a>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
