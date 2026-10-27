import { useEffect, useRef, useState } from 'react'

type UseInViewOptions = {
  /** Carrega um pouco antes de entrar na tela (px). */
  rootMargin?: string
  /** Só dispara uma vez — ideal para imagens. */
  once?: boolean
}

/**
 * Observa se o elemento está (ou está perto de) entrar no viewport.
 */
export function useInView<T extends Element>(options: UseInViewOptions = {}) {
  const { rootMargin = '200px 0px', once = true } = options
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (once && inView) return

    const node = ref.current
    if (!node) return

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setInView(true)
        if (once) observer.disconnect()
      },
      { rootMargin, threshold: 0.01 }
    )

    observer.observe(node)

    const fallback = window.setTimeout(() => {
      setInView(true)
      observer.disconnect()
    }, 2500)

    return () => {
      window.clearTimeout(fallback)
      observer.disconnect()
    }
  }, [rootMargin, once, inView])

  return { ref, inView }
}
