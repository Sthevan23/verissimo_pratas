import { useEffect, useState } from 'react'
import { hydrateCatalogFromServer } from '../services/adminStore'

/**
 * Carrega o catálogo do servidor para a vitrine (todos os visitantes veem as mesmas fotos/produtos).
 */
export function CatalogHydrator({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        await hydrateCatalogFromServer()
      } finally {
        if (alive) {
          setVersion((v) => v + 1)
          setReady(true)
        }
      }
    })()
    return () => {
      alive = false
    }
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-border border-t-graphite rounded-full animate-spin" />
      </div>
    )
  }

  return <div key={version}>{children}</div>
}
