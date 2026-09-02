import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useScrollPosition } from '../hooks/useScrollPosition'
import { Logo } from './Logo'
import { PromoTicker } from './PromoTicker'

type NavChild = { label: string; href: string; subtle?: boolean }
type NavItem = {
  label: string
  href: string
  children?: NavChild[]
}

const navLinks: NavItem[] = [
  { label: 'Anéis', href: '/produtos?categoria=aneis' },
  {
    label: 'Brincos',
    href: '/produtos?categoria=brincos',
    children: [
      { label: 'Ver tudo em Brincos', href: '/produtos?categoria=brincos', subtle: true },
      { label: 'Duplas', href: '/produtos?categoria=brincos-duplas' },
      { label: 'Trios', href: '/produtos?categoria=brincos-trios' },
    ],
  },
  {
    label: 'Colares',
    href: '/produtos?categoria=colares',
    children: [
      { label: 'Ver tudo em Colares', href: '/produtos?categoria=colares', subtle: true },
      { label: 'Conjuntos', href: '/produtos?categoria=conjuntos' },
    ],
  },
  { label: 'Correntes', href: '/produtos?categoria=correntes' },
  { label: 'Pingentes', href: '/produtos?categoria=pingentes' },
  {
    label: 'Pulseiras',
    href: '/produtos?categoria=pulseiras',
    children: [
      { label: 'Ver tudo em Pulseiras', href: '/produtos?categoria=pulseiras', subtle: true },
      { label: 'Braceletes', href: '/produtos?categoria=pulseiras-braceletes' },
      { label: 'Infantil', href: '/produtos?categoria=pulseiras-infantil' },
    ],
  },
  {
    label: 'Berloques',
    href: '/produtos?categoria=berloques',
    children: [
      { label: 'Ver tudo em Berloques', href: '/produtos?categoria=berloques', subtle: true },
      { label: 'Pulseiras', href: '/produtos?categoria=berloques-pulseiras' },
    ],
  },
  {
    label: 'Personalizados',
    href: '/produtos?categoria=personalizados',
    children: [
      { label: 'Ver tudo (encomenda)', href: '/produtos?categoria=personalizados', subtle: true },
      { label: 'Anéis', href: '/produtos?categoria=personalizados-aneis' },
      { label: 'Colares', href: '/produtos?categoria=personalizados-colares' },
      { label: 'Pulseiras', href: '/produtos?categoria=personalizados-pulseiras' },
      { label: 'Berloques', href: '/produtos?categoria=personalizados-berloques' },
      { label: 'Chaveiros', href: '/produtos?categoria=personalizados-chaveiros' },
    ],
  },
  { label: 'Piercings', href: '/produtos?categoria=piercings' },
  { label: 'Tornozeleiras', href: '/produtos?categoria=tornozeleiras' },
  {
    label: 'Masculinos',
    href: '/produtos?categoria=masculinos',
    children: [
      { label: 'Ver tudo em Masculinos', href: '/produtos?categoria=masculinos', subtle: true },
      { label: 'Corrente', href: '/produtos?categoria=masculinos-corrente' },
      { label: 'Pulseira', href: '/produtos?categoria=masculinos-pulseira' },
      { label: 'Pingente', href: '/produtos?categoria=masculinos-pingente' },
    ],
  },
  { label: 'Sobre nós', href: '/sobre' },
]

const mobileNavLinks: NavItem[] = [
  { label: 'Início', href: '/' },
  ...navLinks,
]


export function Header() {
  const isScrolled = useScrollPosition(30)
  const { cartCount, openCart, openSearch, favorites } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [submenu, setSubmenu] = useState<NavItem | null>(null)
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null)
  const [desktopMenuPos, setDesktopMenuPos] = useState<{ top: number; left: number } | null>(
    null
  )
  const desktopRef = useRef<HTMLDivElement>(null)
  const desktopMenuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  const openDesktopMenu = (label: string, anchor: HTMLElement) => {
    const rect = anchor.getBoundingClientRect()
    setDesktopOpen(label)
    setDesktopMenuPos({ top: rect.bottom + 8, left: rect.left })
  }

  const closeDesktopMenu = () => {
    setDesktopOpen(null)
    setDesktopMenuPos(null)
  }

  useEffect(() => {
    setMobileOpen(false)
    setSubmenu(null)
    closeDesktopMenu()
  }, [location.pathname, location.search])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  useEffect(() => {
    if (!desktopOpen) return
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node
      if (desktopRef.current?.contains(t) || desktopMenuRef.current?.contains(t)) return
      closeDesktopMenu()
    }
    const onReposition = () => closeDesktopMenu()
    document.addEventListener('mousedown', onClick)
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
    return () => {
      document.removeEventListener('mousedown', onClick)
      window.removeEventListener('scroll', onReposition, true)
      window.removeEventListener('resize', onReposition)
    }
  }, [desktopOpen])

  const openNavItem = desktopOpen
    ? navLinks.find((l) => l.label === desktopOpen && l.children)
    : null

  const closeMobile = () => {
    setMobileOpen(false)
    setSubmenu(null)
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 safe-top transition-all duration-500 ${
          isScrolled
            ? 'bg-cream shadow-[0_1px_0_0_rgba(0,0,0,0.08)]'
            : 'bg-cream'
        }`}
      >
        <PromoTicker />
        <div
          className={`container-brand transition-[padding] duration-500 ${
            isScrolled ? 'py-3' : 'py-4 lg:py-5'
          }`}
        >
          {/* Desktop — logo/ícones em cima, menu em faixa única embaixo */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between gap-6">
              <Logo />
              <div className="flex items-center gap-4">
                <IconButton onClick={openSearch} label="Buscar">
                  <Search className="w-[18px] h-[18px]" strokeWidth={2} />
                </IconButton>
                <Link to="/produtos" className="relative">
                  <IconButton label="Favoritos">
                    <Heart className="w-[18px] h-[18px]" strokeWidth={2} />
                  </IconButton>
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-green text-white text-[9px] flex items-center justify-center rounded-full">
                      {favorites.length}
                    </span>
                  )}
                </Link>
                <button
                  onClick={openCart}
                  className="relative touch-target text-charcoal hover:text-brand-green transition-colors"
                  aria-label="Carrinho"
                >
                  <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={2} />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 w-4 h-4 bg-brand-green text-white text-[9px] flex items-center justify-center rounded-full"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </button>
              </div>
            </div>

            <nav
              ref={desktopRef}
              className="mt-4 pt-3 border-t border-border -mx-4 sm:-mx-6 lg:-mx-8"
              aria-label="Categorias"
            >
              <div className="overflow-x-auto scrollbar-hide overscroll-x-contain px-4 sm:px-6 lg:px-8">
                <div className="flex w-max min-w-full items-center gap-x-3 xl:gap-x-3.5 2xl:gap-x-4 justify-start 2xl:justify-center pe-6">
                  {navLinks.map((link) =>
                    link.children ? (
                      <button
                        key={link.label}
                        type="button"
                        onClick={(e) => {
                          if (desktopOpen === link.label) closeDesktopMenu()
                          else openDesktopMenu(link.label, e.currentTarget)
                        }}
                        className="shrink-0 inline-flex items-center gap-0.5 text-xs xl:text-[13px] tracking-[0.05em] xl:tracking-[0.07em] uppercase text-warm-gray hover:text-brand-green font-light transition-colors duration-300 whitespace-nowrap"
                        aria-expanded={desktopOpen === link.label}
                        aria-haspopup="menu"
                      >
                        {link.label}
                        <ChevronDown
                          className={`w-3.5 h-3.5 opacity-80 transition-transform ${
                            desktopOpen === link.label ? 'rotate-180' : ''
                          }`}
                          strokeWidth={1.5}
                        />
                      </button>
                    ) : (
                      <Link
                        key={link.href}
                        to={link.href}
                        className="shrink-0 text-xs xl:text-[13px] tracking-[0.05em] xl:tracking-[0.07em] uppercase text-warm-gray hover:text-brand-green font-light transition-colors duration-300 link-underline whitespace-nowrap"
                      >
                        {link.label}
                      </Link>
                    )
                  )}
                </div>
              </div>
            </nav>

            {typeof document !== 'undefined' &&
              openNavItem?.children &&
              desktopMenuPos &&
              createPortal(
                <AnimatePresence>
                  <motion.div
                    ref={desktopMenuRef}
                    role="menu"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18 }}
                    style={{
                      position: 'fixed',
                      top: desktopMenuPos.top,
                      left: desktopMenuPos.left,
                      zIndex: 200,
                    }}
                    className="bg-cream border border-border shadow-[0_8px_24px_rgba(0,0,0,0.1)] min-w-[12rem] py-1"
                  >
                    {openNavItem.children.map((child) => (
                      <Link
                        key={child.href + child.label}
                        to={child.href}
                        role="menuitem"
                        onClick={closeDesktopMenu}
                        className={`block px-4 py-3 tracking-[0.1em] uppercase transition-colors border-b border-border/40 last:border-0 ${
                          child.subtle
                            ? 'text-xs text-charcoal/80 hover:text-graphite hover:bg-off-white'
                            : 'text-sm text-graphite hover:bg-off-white font-medium'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </motion.div>
                </AnimatePresence>,
                document.body
              )}
          </div>

          {/* Mobile — menu | logo | carrinho + busca (estilo Mafena) */}
          <div className="lg:hidden">
            <div className="grid grid-cols-[44px_1fr_44px] items-center gap-1 min-h-[44px]">
              <button
                onClick={() => setMobileOpen(true)}
                className="touch-target -ml-2 text-graphite"
                aria-label="Menu"
              >
                <Menu className="w-5 h-5" strokeWidth={1.5} />
              </button>

              <div className="flex justify-center overflow-hidden px-1">
                <Logo compact />
              </div>

              <button
                onClick={openCart}
                className="relative touch-target -mr-2 justify-self-end text-graphite"
                aria-label="Carrinho"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-brand-green text-white text-[8px] flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={openSearch}
              className="mt-3 w-full flex items-center gap-2 border border-border bg-white px-3 py-3 text-left"
              aria-label="Buscar produtos"
            >
              <span className="flex-1 text-sm text-charcoal font-normal">Buscar</span>
              <Search className="w-4 h-4 text-charcoal shrink-0" strokeWidth={2} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer — menu principal + submenu ao clicar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-graphite/40 z-[60] lg:hidden"
              onClick={closeMobile}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-0 left-0 bottom-0 w-[min(88vw,21rem)] bg-cream z-[70] lg:hidden flex flex-col safe-top safe-bottom overflow-hidden"
            >
              <div className="relative flex-1 flex flex-col min-h-0">
                {/* Painel principal */}
                <div
                  className={`absolute inset-0 flex flex-col transition-transform duration-300 ease-out ${
                    submenu ? '-translate-x-full' : 'translate-x-0'
                  }`}
                >
                  <div className="flex items-center justify-between px-5 py-5 border-b border-border shrink-0">
                    <Logo />
                    <button
                      onClick={closeMobile}
                      className="touch-target text-graphite"
                      aria-label="Fechar"
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto py-2 px-5">
                    {mobileNavLinks.map((link) =>
                      link.children ? (
                        <button
                          key={link.label}
                          type="button"
                          onClick={() => setSubmenu(link)}
                          className="flex w-full items-center justify-between py-4 text-sm tracking-[0.12em] uppercase text-graphite border-b border-border/50 active:bg-off-white"
                        >
                          {link.label}
                          <ChevronRight className="w-4 h-4 text-muted" strokeWidth={1.5} />
                        </button>
                      ) : (
                        <Link
                          key={link.href}
                          to={link.href}
                          onClick={closeMobile}
                          className="block py-4 text-sm tracking-[0.12em] uppercase text-graphite border-b border-border/50 active:bg-off-white"
                        >
                          {link.label}
                        </Link>
                      )
                    )}
                  </div>

                  <div className="border-t border-border px-5 py-5 grid grid-cols-2 gap-2 shrink-0">
                    <button
                      onClick={() => {
                        closeMobile()
                        openSearch()
                      }}
                      className="flex flex-col items-center gap-1.5 py-3 text-[10px] tracking-wider uppercase text-warm-gray active:bg-off-white"
                    >
                      <Search className="w-5 h-5" strokeWidth={1.5} />
                      Buscar
                    </button>
                    <Link
                      to="/produtos"
                      onClick={closeMobile}
                      className="flex flex-col items-center gap-1.5 py-3 text-[10px] tracking-wider uppercase text-warm-gray active:bg-off-white relative"
                    >
                      <Heart className="w-5 h-5" strokeWidth={1.5} />
                      Favoritos
                      {favorites.length > 0 && (
                        <span className="absolute top-2 right-1/2 translate-x-4 w-4 h-4 bg-brand-green text-white text-[8px] flex items-center justify-center rounded-full">
                          {favorites.length}
                        </span>
                      )}
                    </Link>
                  </div>
                </div>

                {/* Painel de opções (ex.: Brincos → Ver tudo / Duplas / Trios) */}
                <div
                  className={`absolute inset-0 flex flex-col bg-cream transition-transform duration-300 ease-out ${
                    submenu ? 'translate-x-0' : 'translate-x-full'
                  }`}
                >
                  <div className="flex items-center gap-1 px-3 py-4 border-b border-border shrink-0">
                    <button
                      type="button"
                      onClick={() => setSubmenu(null)}
                      className="touch-target text-graphite flex items-center gap-1"
                      aria-label="Voltar"
                    >
                      <ChevronLeft className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                    <p className="flex-1 text-center text-sm tracking-[0.15em] uppercase text-graphite">
                      {submenu?.label}
                    </p>
                    <button
                      onClick={closeMobile}
                      className="touch-target text-graphite"
                      aria-label="Fechar"
                    >
                      <X className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-5 py-2">
                    {submenu?.children?.map((child) => (
                      <Link
                        key={child.href + child.label}
                        to={child.href}
                        onClick={closeMobile}
                        className={`flex items-center justify-between py-4 tracking-[0.12em] uppercase border-b border-border/50 active:bg-off-white ${
                          child.subtle
                            ? 'text-xs text-muted'
                            : 'text-sm text-graphite font-medium'
                        }`}
                      >
                        {child.label}
                        <ChevronRight className="w-4 h-4 text-muted" strokeWidth={1.5} />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function IconButton({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode
  onClick?: () => void
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className="touch-target text-charcoal hover:text-brand-green transition-colors"
      aria-label={label}
    >
      {children}
    </button>
  )
}
