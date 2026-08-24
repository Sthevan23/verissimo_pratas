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
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useScrollPosition } from '../hooks/useScrollPosition'
import { Logo } from './Logo'

type NavChild = { label: string; href: string; subtle?: boolean }
type NavItem = {
  label: string
  href: string
  children?: NavChild[]
}

const navLinks: NavItem[] = [
  { label: 'Início', href: '/' },
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
  { label: 'Colares', href: '/produtos?categoria=colares' },
  { label: 'Conjuntos', href: '/produtos?categoria=conjuntos' },
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
  { label: 'Piercings', href: '/produtos?categoria=piercings' },
  { label: 'Tornozeleira', href: '/produtos?categoria=tornozeleiras' },
  { label: 'Acessórios', href: '/produtos?categoria=acessorios' },
  { label: 'Sobre nós', href: '/sobre' },
]

export function Header() {
  const isScrolled = useScrollPosition(30)
  const { cartCount, openCart, openSearch, favorites } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [submenu, setSubmenu] = useState<NavItem | null>(null)
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null)
  const desktopRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    setSubmenu(null)
    setDesktopOpen(null)
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
      if (desktopRef.current && !desktopRef.current.contains(e.target as Node)) {
        setDesktopOpen(null)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [desktopOpen])

  const closeMobile = () => {
    setMobileOpen(false)
    setSubmenu(null)
  }

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 safe-top transition-all duration-500 ${
          isScrolled
            ? 'bg-cream/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(0,0,0,0.05)] py-3'
            : 'bg-cream/80 backdrop-blur-sm lg:bg-transparent py-4 lg:py-6'
        }`}
      >
        <div className="container-brand">
          {/* Desktop — logo/ícones em cima, menu em faixa única embaixo */}
          <div className="hidden lg:block">
            <div className="flex items-center justify-between gap-6">
              <Logo />
              <div className="flex items-center gap-4">
                <IconButton onClick={openSearch} label="Buscar">
                  <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
                </IconButton>
                <Link to="/produtos" className="relative">
                  <IconButton label="Favoritos">
                    <Heart className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  </IconButton>
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-graphite text-cream text-[9px] flex items-center justify-center rounded-full">
                      {favorites.length}
                    </span>
                  )}
                </Link>
                <button
                  onClick={openCart}
                  className="relative touch-target text-graphite hover:text-charcoal transition-colors"
                  aria-label="Carrinho"
                >
                  <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.5} />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-1 right-1 w-4 h-4 bg-graphite text-cream text-[9px] flex items-center justify-center rounded-full"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </button>
              </div>
            </div>

            <nav
              ref={desktopRef}
              className="mt-4 pt-3 border-t border-border/50 flex items-center justify-center gap-x-3 xl:gap-x-4 2xl:gap-x-5 flex-nowrap overflow-x-auto scrollbar-hide"
            >
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setDesktopOpen((cur) => (cur === link.label ? null : link.label))
                      }
                      className="inline-flex items-center gap-0.5 text-[9px] xl:text-[10px] 2xl:text-[11px] tracking-[0.1em] xl:tracking-[0.12em] uppercase text-warm-gray hover:text-graphite transition-colors duration-300 whitespace-nowrap"
                      aria-expanded={desktopOpen === link.label}
                    >
                      {link.label}
                      <ChevronDown
                        className={`w-3 h-3 opacity-60 transition-transform ${
                          desktopOpen === link.label ? 'rotate-180' : ''
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                    <AnimatePresence>
                      {desktopOpen === link.label && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.18 }}
                          className="absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50"
                        >
                          <div className="bg-cream border border-border shadow-[0_8px_24px_rgba(0,0,0,0.06)] min-w-[12rem] py-1">
                            {link.children.map((child) => (
                              <Link
                                key={child.href + child.label}
                                to={child.href}
                                onClick={() => setDesktopOpen(null)}
                                className={`block px-4 py-3 tracking-[0.12em] uppercase transition-colors border-b border-border/40 last:border-0 ${
                                  child.subtle
                                    ? 'text-[10px] text-muted hover:text-graphite hover:bg-off-white'
                                    : 'text-[11px] text-graphite hover:bg-off-white font-medium'
                                }`}
                              >
                                {child.label}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="shrink-0 text-[9px] xl:text-[10px] 2xl:text-[11px] tracking-[0.1em] xl:tracking-[0.12em] uppercase text-warm-gray hover:text-graphite transition-colors duration-300 link-underline whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </div>

          {/* Mobile top bar */}
          <div className="grid lg:hidden grid-cols-[44px_1fr_88px] items-center gap-1 min-h-[44px]">
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

            <div className="flex items-center justify-end gap-0">
              <button
                onClick={openSearch}
                className="touch-target text-graphite"
                aria-label="Buscar"
              >
                <Search className="w-5 h-5" strokeWidth={1.5} />
              </button>
              <button
                onClick={openCart}
                className="relative touch-target -mr-2 text-graphite"
                aria-label="Carrinho"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-graphite text-cream text-[8px] flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
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
                    {navLinks.map((link) =>
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
                        <span className="absolute top-2 right-1/2 translate-x-4 w-4 h-4 bg-graphite text-cream text-[8px] flex items-center justify-center rounded-full">
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
      className="touch-target text-graphite hover:text-charcoal transition-colors"
      aria-label={label}
    >
      {children}
    </button>
  )
}
