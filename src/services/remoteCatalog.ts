import type { AdminCategory, AdminProduct, StoreSettings } from '../types/admin'

export interface RemoteSiteCatalog {
  products: AdminProduct[]
  categories: AdminCategory[]
  settings: StoreSettings | null
}

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

/** Baixa catálogo + categorias + configurações do servidor */
export async function fetchRemoteCatalog(): Promise<RemoteSiteCatalog | null> {
  try {
    const res = await fetch('/api/catalog.php', { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    if (!data?.ok || !Array.isArray(data.products)) return null
    return {
      products: data.products as AdminProduct[],
      categories: Array.isArray(data.categories) ? (data.categories as AdminCategory[]) : [],
      settings: data.settings ?? null,
    }
  } catch {
    return null
  }
}

/** Publica conteúdo do site no servidor (visível para todos) */
export async function pushCatalogToServer(payload: {
  products: AdminProduct[]
  categories?: AdminCategory[]
  settings?: StoreSettings
}): Promise<boolean> {
  try {
    const res = await fetch('/api/catalog.php', {
      method: 'POST',
      headers: writeHeaders(),
      body: JSON.stringify(payload),
    })
    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data?.ok)
  } catch {
    return false
  }
}

/** Envia arquivo de imagem para o servidor */
export async function uploadProductFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file, file.name || 'foto.jpg')
  const res = await fetch('/api/upload.php', {
    method: 'POST',
    headers: { 'X-Verissimo-Token': WRITE_TOKEN },
    body: form,
  })
  const raw = await res.text()
  let data: { ok?: boolean; url?: string; error?: string } | null = null
  try {
    data = JSON.parse(raw) as { ok?: boolean; url?: string; error?: string }
  } catch {
    throw new Error(
      res.ok
        ? 'Resposta inválida do servidor ao enviar foto.'
        : `Erro ${res.status} ao enviar foto. Tente de novo.`
    )
  }
  if (!res.ok || !data?.ok || !data.url) {
    throw new Error(data?.error || 'Falha no upload da imagem')
  }
  return data.url
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  return ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'].includes(ext)
}

async function compressWithCanvas(
  source: CanvasImageSource,
  file: File,
  maxSide: number,
  quality: number
): Promise<File | null> {
  let w = 0
  let h = 0
  if (source instanceof HTMLImageElement) {
    w = source.naturalWidth || source.width
    h = source.naturalHeight || source.height
  } else if (source instanceof HTMLVideoElement) {
    w = source.videoWidth
    h = source.videoHeight
  } else if (source instanceof ImageBitmap) {
    w = source.width
    h = source.height
  } else if (source instanceof HTMLCanvasElement) {
    w = source.width
    h = source.height
  }
  if (!w || !h) return null

  const scale = Math.min(1, maxSide / Math.max(w, h))
  const cw = Math.round(w * scale)
  const ch = Math.round(h * scale)
  const canvas = document.createElement('canvas')
  canvas.width = cw
  canvas.height = ch
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.drawImage(source, 0, 0, cw, ch)

  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
  )
  if (!blob) return null
  const base = file.name.replace(/\.[^.]+$/, '') || 'foto'
  return new File([blob], `${base}.jpg`, { type: 'image/jpeg' })
}

/** Compacta imagem (galeria/câmera) — converte HEIC e fotos grandes para JPEG */
export async function compressImageFile(file: File, maxSide = 1600, quality = 0.82): Promise<File> {
  if (!isImageFile(file)) {
    throw new Error('Arquivo não é uma imagem válida.')
  }

  // Já pequena e JPEG — envia direto
  if (
    file.size < 400_000 &&
    (file.type === 'image/jpeg' || file.name.toLowerCase().endsWith('.jpg'))
  ) {
    return file
  }

  // createImageBitmap (Android / desktop)
  try {
    const bitmap = await createImageBitmap(file)
    const out = await compressWithCanvas(bitmap, file, maxSide, quality)
    bitmap.close()
    if (out) return out
  } catch {
    // segue para fallback
  }

  // <img> — melhor compatibilidade com galeria do iPhone (HEIC)
  const fromImg = await new Promise<File | null>((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = async () => {
      const out = await compressWithCanvas(img, file, maxSide, quality)
      URL.revokeObjectURL(url)
      resolve(out)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    img.src = url
  })
  if (fromImg) return fromImg

  // Último recurso: envia original se for imagem conhecida
  if (file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp') {
    return file
  }

  throw new Error(
    'Não foi possível processar esta foto. Tente outra imagem ou tire uma foto nova.'
  )
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
      images.push(normalizeProductImageUrl(src))
    }
  }
  return { ...product, images }
}

/** Normaliza URL antiga /uploads/... para o proxy PHP (evita 500 na Hostinger) */
export function normalizeProductImageUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('/api/media.php')) return url
  const m = url.match(/\/uploads\/products\/([^/?#]+)$/i)
  if (m) return `/api/media.php?f=${encodeURIComponent(m[1])}`
  return url
}

export function normalizeProductImages<T extends { images: string[] }>(product: T): T {
  return {
    ...product,
    images: product.images.map(normalizeProductImageUrl),
  }
}
