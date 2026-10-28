import { useEffect, useState } from 'react'
import { fetchRemoteCatalog, normalizeProductImages } from '../services/remoteCatalog'
import { setStorefrontCatalog } from '../services/catalogMemory'
import { isPublishedOnStorefront } from '../services/storeService'

/**
 * Atualiza o catálogo da vitrine em segundo plano.
 * A loja abre na hora (cache/local) — não trava a tela no spinner.
 */
export function CatalogHydrator({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let alive = true

    ;(async () => {
      try {
        let remote = await fetchRemoteCatalog()
        if (!remote?.products?.length) {
          await new Promise((r) => setTimeout(r, 600))
          remote = await fetchRemoteCatalog()
        }
        if (!alive || !remote?.products?.length) return

        const normalized = remote.products.map((p) => normalizeProductImages(p))
        setStorefrontCatalog(normalized.filter(isPublishedOnStorefront))
        setVersion((v) => v + 1)
      } catch (err) {
        console.warn('Catálogo remoto indisponível; usando cache local', err)
      }
    })()

    return () => {
      alive = false
    }
  }, [])

  return <div key={version}>{children}</div>
}
