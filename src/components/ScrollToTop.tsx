import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Volta ao topo em toda troca de rota (evita abrir produto no meio da página). */
export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
