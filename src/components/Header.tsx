import { AnimatePresence, motion } from 'framer-motion'
import {
  ChevronDown,
  Heart,
  Menu,
  Search,
  ShoppingBag,
  User,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useScrollPosition } from '../hooks/useScrollPosition'
import { Logo } from './Logo'

type NavItem = {
  label: string
  href: string
  children?: { label: string; href: string }[]
}

const navLinks: NavItem[] = [
  { label: 'Início', href: '/' },
  { label: 'Anéis', href: '/produtos?categoria=aneis' },
  {
    label: 'Brincos',
    href: '/produtos?categoria=brincos',
    children: [
      { label: 'Unitários', href: '/produtos?categoria=brincos' },
      { label: 'Duplas', href: '/produtos?categoria=brincos-duplas' },
      { label: 'Trios', href: '/produtos?categoria=brincos-trios' },
    ],
  },
  { label: 'Colares', href: '/produtos?categoria=colares' },
  { label: 'Correntes', href: '/produtos?categoria=correntes' },
  { label: 'Pingentes', href: '/produtos?categoria=pingentes' },
  { label: 'Pulseiras', href: '/produtos?categoria=pulseiras' },
  { label: 'Berloques', href: '/produtos?categoria=berloques' },
  { label: 'Piercings', href: '/produtos?categoria=piercings' },
  { label: 'Tornozeleira', href: '/produtos?categoria=tornozeleiras' },
  { label: 'Acessórios', href: '/produtos?categoria=acessorios' },
  { label: 'Sobre nós', href: '/sobre' },
]

export function Header() {
  const isScrolled = useScrollPosition(30)
  const { cartCount, openCart, openSearch, favorites } = useApp()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [brincosOpen, setBrincosOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
    setBrincosOpen(false)
  }, [location.pathname, location.search])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

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
          {/* Desktop */}
          <div className="hidden lg:grid grid-cols-[auto_1fr_auto] items-center gap-6">
            <div className="justify-self-start">
              <Logo />
            </div>

            <nav className="flex items-center justify-center flex-wrap gap-x-4 gap-y-2 xl:gap-x-5">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className="relative group">
                    <Link
                      to={link.href}
                      className="inline-flex items-center gap-1 text-[10px] xl:text-[11px] tracking-[0.12em] uppercase text-warm-gray hover:text-graphite transition-colors duration-300 whitespace-nowrap"
                    >
                      {link.label}
                      <ChevronDown className="w-3 h-3 opacity-60" strokeWidth={1.5} />
                    </Link>
                    <div className="invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 absolute top-full left-1/2 -translate-x-1/2 pt-3 z-50">
                      <div className="bg-cream border border-border shadow-[0_8px_24px_rgba(0,0,0,0.06)] min-w-[11rem] py-2">
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            to={child.href}
                            className="block px-4 py-2.5 text-[10px] tracking-[0.12em] uppercase text-warm-gray hover:text-graphite hover:bg-off-white transition-colors"
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-[10px] xl:text-[11px] tracking-[0.12em] uppercase text-warm-gray hover:text-graphite transition-colors duration-300 link-underline whitespace-nowrap"
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            <div className="flex items-center gap-4 justify-self-end">
              <IconButton onClick={openSearch} label="Buscar">
                <Search className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </IconButton>
              <IconButton label="Conta">
                <User className="w-[18px] h-[18px]" strokeWidth={1.5} />
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

          {/* Mobile */}
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

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-graphite/40 z-[60] lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'tween', duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="fixed top-0 left-0 bottom-0 w-[min(85vw,20rem)] bg-cream z-[70] lg:hidden flex flex-col safe-top safe-bottom"
            >
              <div className="flex items-center justify-between px-5 py-5 border-b border-border">
                <Logo />
                <button
                  onClick={() => setMobileOpen(false)}
                  className="touch-target text-graphite"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-5">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    {link.children ? (
                      <div className="border-b border-border/50">
                        <button
                          type="button"
                          onClick={() => setBrincosOpen((o) => !o)}
                          className="flex w-full items-center justify-between py-4 text-sm tracking-[0.12em] uppercase text-graphite active:bg-off-white"
                          aria-expanded={brincosOpen}
                        >
                          {link.label}
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${brincosOpen ? 'rotate-180' : ''}`}
                            strokeWidth={1.5}
                          />
                        </button>
                        <AnimatePresence>
                          {brincosOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pb-3 pl-3 space-y-1">
                                {link.children.map((child) => (
                                  <Link
                                    key={child.href}
                                    to={child.href}
                                    className="block py-2.5 text-xs tracking-[0.12em] uppercase text-warm-gray active:bg-off-white"
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
                        to={link.href}
                        className="block py-4 text-sm tracking-[0.12em] uppercase text-graphite border-b border-border/50 active:bg-off-white"
                      >
                        {link.label}
                      </Link>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="border-t border-border px-5 py-5 grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    openSearch()
                  }}
                  className="flex flex-col items-center gap-1.5 py-3 text-[10px] tracking-wider uppercase text-warm-gray active:bg-off-white"
                >
                  <Search className="w-5 h-5" strokeWidth={1.5} />
                  Buscar
                </button>
                <Link
                  to="/produtos"
                  className="flex flex-col items-center gap-1.5 py-3 text-[10px] tracking-wider uppercase text-warm-gray active:bg-off-white relative"
                >
                  <Heart className="w-5 h-5" strokeWidth={1.5} />
                  Favoritos
                  {favorites.length > 0 && (
                    <span className="absolute top-2 right-3 w-4 h-4 bg-graphite text-cream text-[8px] flex items-center justify-center rounded-full">
                      {favorites.length}
                    </span>
                  )}
                </Link>
                <button className="flex flex-col items-center gap-1.5 py-3 text-[10px] tracking-wider uppercase text-warm-gray active:bg-off-white">
                  <User className="w-5 h-5" strokeWidth={1.5} />
                  Conta
                </button>
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
