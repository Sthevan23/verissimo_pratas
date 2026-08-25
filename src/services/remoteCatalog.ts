import type { AdminProduct } from '../types/admin'

const WRITE_TOKEN =
  import.meta.env.VITE_ADMIN_PASSWORD ||
  import.meta.env.VITE_API_TOKEN ||
  'Verissimo@2026'

function writeHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Verissimo-Token': WRITE_TOKEN,
  }
}

/** Baixa o catálogo publicado no servidor */
export async function fetchRemoteCatalog(): Promise<AdminProduct[] | null> {
  try {
    const res = await fetch('/api/catalog.php', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.ok || !Array.isArray(data.products)) return null
    return data.products as AdminProduct[]
  } catch {
    return null
  }
}

/** Publica a lista de produtos no servidor (visível para todos) */
export async function pushCatalogToServer(products: AdminProduct[]): Promise<boolean> {
  try {
    const res = await fetch('/api/catalog.php', {
      method: 'POST',
      headers: writeHeaders(),
      body: JSON.stringify({ products }),
    })
    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data?.ok)
  } catch {
    return false
  }
}

/** Envia arquivo de imagem para /uploads/products/ */
export async function uploadProductFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/upload.php', {
    method: 'POST',
    headers: { 'X-Verissimo-Token': WRITE_TOKEN },
    body: form,
  })
  const data = await res.json()
  if (!res.ok || !data?.ok || !data.url) {
    throw new Error(data?.error || 'Falha no upload da imagem')
  }
  return data.url as string
}

/** Converte data-URL (base64) em File e faz upload */
export async function uploadDataUrl(dataUrl: string, filename = 'foto.jpg'): Promise<string> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const ext = blob.type.includes('png')
    ? 'png'
    : blob.type.includes('webp')
      ? 'webp'
      : 'jpg'
  const file = new File([blob], filename.replace(/\.\w+$/, '') + '.' + ext, {
    type: blob.type || 'image/jpeg',
  })
  return uploadProductFile(file)
}

/** Garante que todas as imagens do produto sejam URLs públicas (não base64) */
export async function ensurePublicImages(product: AdminProduct): Promise<AdminProduct> {
  const images: string[] = []
  for (let i = 0; i < product.images.length; i++) {
    const src = product.images[i]
    if (!src) continue
    if (src.startsWith('data:')) {
      images.push(await uploadDataUrl(src, `produto-${product.id}-${i}`))
    } else {
      images.push(src)
    }
  }
  return { ...product, images }
}

/** Compacta imagem no celular antes do upload (máx. 1600px / JPEG) */
export async function compressImageFile(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  if (!file.type.startsWith('image/')) return file
  if (file.size < 400_000) return file

  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  )
  if (!blob) return file
  return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', {
    type: 'image/jpeg',
  })
}
