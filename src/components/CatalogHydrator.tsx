import { useEffect, useState } from 'react'
import { hydrateCatalogFromServer } from '../services/adminStore'
import { fetchRemoteCatalog, normalizeProductImages } from '../services/remoteCatalog'
import { setStorefrontCatalog } from '../services/catalogMemory'

/**
 * Carrega o catálogo do servidor para a vitrine.
 * Prioridade: memória (fotos corretas) → depois sincroniza localStorage do admin.
 */
export function CatalogHydrator({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const remote = await fetchRemoteCatalog()
        if (remote?.products?.length) {
          const normalized = remote.products.map((p) => normalizeProductImages(p))
          setStorefrontCatalog(normalized)
        }
        // Espelha no localStorage (admin); se falhar, a vitrine já tem as fotos na memória
        await hydrateCatalogFromServer()
      } catch (err) {
        console.error('Falha ao hidratar catálogo', err)
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
