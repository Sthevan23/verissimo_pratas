import { Link } from 'react-router-dom'
import { InstagramIcon } from './ui/SocialIcons'
import { Logo } from './Logo'
import { STORE_CONTACT, whatsappLink } from '../data/contact'

const footerLinks = {
  marca: [
    { label: 'Sobre nós', href: '/sobre' },
    { label: 'Nossa história', href: '/sobre#historia' },
    { label: 'Contato', href: '/sobre#contato' },
  ],
  atendimento: [
    { label: 'Fale conosco', href: whatsappLink(), external: true },
    { label: 'WhatsApp', href: whatsappLink(), external: true },
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
    <footer className="bg-brand-green text-white pt-12 sm:pt-16 pb-8 safe-bottom">
      <div className="container-brand">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-8 mb-12 sm:mb-14">
          <div className="sm:col-span-2 lg:col-span-1 text-center sm:text-left">
            <div className="mb-4">
              <Logo variant="dark" />
            </div>
            <p className="text-sm text-white/75 font-light leading-relaxed max-w-xs mx-auto sm:mx-0">
              Joias em prata 925 com elegância atemporal. Garantia vitalícia e
              envio para todo o Brasil.
            </p>
          </div>

          <FooterColumn title="Verissimo Pratas" links={footerLinks.marca} />
          <FooterColumn title="Atendimento" links={footerLinks.atendimento} />
          <FooterColumn title="Compra" links={footerLinks.compra} />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center sm:justify-between gap-6 pt-8 border-t border-white/20 text-center sm:text-left">
          <p className="text-xs text-white/70 font-light">
            © {new Date().getFullYear()} Verissimo Pratas 925. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-5">
            <SocialLink
              href={STORE_CONTACT.instagramUrl}
              label="Instagram"
              icon={<InstagramIcon className="w-4 h-4" />}
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
      <h4 className="text-[10px] tracking-[0.2em] uppercase text-white/85 mb-4">
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
                className="text-sm text-white/75 font-light hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ) : (
              <Link
                to={link.href}
                className="text-sm text-white/75 font-light hover:text-white transition-colors"
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
      className="text-white/75 hover:text-white transition-colors"
      aria-label={label}
    >
      {icon}
    </a>
  )
}
