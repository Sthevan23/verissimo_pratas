import { InstagramIcon } from './ui/SocialIcons'
import { AnimateIn } from './ui/AnimateIn'

const instagramImages = [
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7459-jpg-ae93f851c77204047a17840546062480-480-0.webp',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4817-jpg-bc43e9cb0a124925e817801724891973-480-0.webp',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7372-jpg-1625f9af83ae02340c17840446565786-480-0.webp',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_4633-9c3c043dc188f7692c17807857126302-480-0.webp',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_1216-jpg-d16ce5b4c77552954417798372394070-480-0.webp',
  'https://dcdn-us.mitiendanube.com/stores/003/936/343/products/img_7549-240e76c14ba192830017842945307545-480-0.webp',
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
            href="https://instagram.com/verissimopratos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-warm-gray hover:text-graphite transition-colors link-underline"
          >
            <InstagramIcon className="w-4 h-4" />
            @verissimopratos
          </a>
        </AnimateIn>

        <div className="grid grid-cols-3 lg:grid-cols-6 gap-1.5 lg:gap-2">
          {instagramImages.map((img, i) => (
            <AnimateIn key={i} delay={i * 0.05}>
              <a
                href="https://instagram.com/verissimopratos"
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
                  <InstagramIcon className="w-6 h-6 text-cream opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </a>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
