import { InstagramIcon } from './ui/SocialIcons'
import { AnimateIn } from './ui/AnimateIn'
import { STORE_CONTACT } from '../data/contact'

export function InstagramFeed() {
  return (
    <section className="py-20 lg:py-28 bg-off-white/40">
      <div className="container-brand">
        <AnimateIn className="text-center">
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
      </div>
    </section>
  )
}
