import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Search, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatPrice } from '../utils/format'

export function SearchOverlay() {
  const {
    isSearchOpen,
    closeSearch,
    searchQuery,
    setSearchQuery,
    searchResults,
  } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isSearchOpen])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [closeSearch])

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-cream/95 backdrop-blur-md"
        >
          <div className="container-brand pt-8 lg:pt-12">
            <div className="flex items-center gap-4 border-b border-border pb-4">
              <Search className="w-5 h-5 text-muted shrink-0" strokeWidth={1.5} />
              <input
                ref={inputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar anéis, brincos, colares..."
                className="flex-1 bg-transparent text-lg lg:text-xl font-light text-graphite placeholder:text-muted focus:outline-none"
                aria-label="Buscar produtos"
              />
              <button
                onClick={closeSearch}
                className="p-2 hover:bg-off-white transition-colors"
                aria-label="Fechar busca"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            <div className="py-8 max-w-2xl">
              {searchQuery.trim() === '' ? (
                <div>
                  <p className="text-[11px] tracking-[0.2em] uppercase text-muted mb-4">
                    Buscas populares
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Anel', 'Brinco', 'Colar', 'Pulseira', 'Berloque', 'Conjunto'].map(
                      (term) => (
                        <button
                          key={term}
                          onClick={() => setSearchQuery(term.toLowerCase())}
                          className="px-4 py-2 border border-border text-sm font-light hover:border-graphite transition-colors"
                        >
                          {term}
                        </button>
                      )
                    )}
                  </div>
                </div>
              ) : searchResults.length === 0 ? (
                <p className="text-warm-gray font-light">
                  Nenhum resultado para "{searchQuery}"
                </p>
              ) : (
                <ul className="space-y-1">
                  {searchResults.map((result) => (
                    <li key={`${result.type}-${result.id}`}>
                      <Link
                        to={result.href}
                        onClick={closeSearch}
                        className="flex items-center gap-4 py-3 px-2 hover:bg-off-white transition-colors group"
                      >
                        {result.image && (
                          <img
                            src={result.image}
                            alt=""
                            className="w-12 h-12 object-cover bg-off-white"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] tracking-widest uppercase text-muted">
                            {result.type === 'product'
                              ? 'Produto'
                              : result.type === 'category'
                                ? 'Categoria'
                                : 'Sugestão'}
                          </span>
                          <p className="text-sm font-light text-graphite truncate">
                            {result.label}
                          </p>
                        </div>
                        {result.price && (
                          <span className="text-sm text-warm-gray shrink-0">
                            {formatPrice(result.price)}
                          </span>
                        )}
                        <ArrowRight className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" strokeWidth={1.5} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
