import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Volta ao topo em toda troca de página no site (loja + admin). */
export function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return

    // Âncoras (#historia, #faq…) ficam a cargo da página
    if (hash) return

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }

    const html = document.documentElement
    const previous = html.style.scrollBehavior
    html.style.scrollBehavior = 'auto'

    window.scrollTo(0, 0)
    html.scrollTop = 0
    document.body.scrollTop = 0

    // Reforço após o paint (imagens / AnimatePresence)
    requestAnimationFrame(() => {
      window.scrollTo(0, 0)
    })

    html.style.scrollBehavior = previous
  }, [pathname, search, hash])

  return null
}
