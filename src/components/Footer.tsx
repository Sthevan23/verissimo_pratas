import { Link } from 'react-router-dom'
import { FacebookIcon, InstagramIcon } from './ui/SocialIcons'
import { Logo } from './Logo'

const footerLinks = {
  marca: [
    { label: 'Sobre nós', href: '/sobre' },
    { label: 'Nossa história', href: '/sobre#historia' },
    { label: 'Contato', href: '/sobre#contato' },
  ],
  atendimento: [
    { label: 'Fale conosco', href: 'https://wa.me/5535991240681', external: true },
    { label: 'WhatsApp', href: 'https://wa.me/5535991240681', external: true },
    { label: 'Garantia e cuidados', href: '/sobre#garantia' },
    { label: 'Trocas e devoluções', href: '/sobre#trocas' },
    { label: 'Perguntas frequentes', href: '/sobre#faq' },
  ],
  compra: [
    { label: 'Formas de pagamento', href: '/sobre#pagamento' },
    { label: 'Entrega', href: '/sobre#entrega' },
    { label: 'Política de privacidade', href: '/sobre#privacidade' },
    { label: 'Termos de uso', href: '/sobre#termos' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-graphite text-cream pt-12 sm:pt-16 pb-8 safe-bottom">
      <div className="container-brand">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8 mb-12 sm:mb-14">
          <div className="sm:col-span-2 lg:col-span-1 text-center sm:text-left">
            <div className="mb-4">
              <Logo variant="dark" />
            </div>
            <p className="text-sm text-silver-dark font-light leading-relaxed max-w-xs mx-auto sm:mx-0">
              Joias em prata 925 com elegância atemporal. Garantia vitalícia e
              envio para todo o Brasil.
            </p>
          </div>

          <FooterColumn title="Verissimo Pratas" links={footerLinks.marca} />
          <FooterColumn title="Atendimento" links={footerLinks.atendimento} />
          <FooterColumn title="Compra" links={footerLinks.compra} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 pt-8 border-t border-charcoal text-center sm:text-left">
          <p className="text-xs text-silver-dark font-light">
            © {new Date().getFullYear()} Verissimo Pratas 925. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-5">
            <SocialLink
              href="https://instagram.com/verissimopratos"
              label="Instagram"
              icon={<InstagramIcon className="w-4 h-4" />}
            />
            <SocialLink
              href="https://www.facebook.com/verissimopratos"
              label="Facebook"
              icon={<FacebookIcon className="w-4 h-4" />}
            />
            <SocialLink
              href="https://www.tiktok.com/@verissimopratos"
              label="TikTok"
              icon={
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                </svg>
              }
            />
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: { label: string; href: string; external?: boolean }[]
}) {
  return (
    <div>
      <h4 className="text-[10px] tracking-[0.2em] uppercase text-silver mb-4">
        {title}
      </h4>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-silver-dark font-light hover:text-cream transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                to={link.href}
                className="text-sm text-silver-dark font-light hover:text-cream transition-colors"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SocialLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-silver-dark hover:text-cream transition-colors"
      aria-label={label}
    >
      {icon}
    </a>
  )
}
