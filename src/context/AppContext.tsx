import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { categories } from '../data/categories'
import { searchProducts } from '../data/products'
import type { CartItem, Product, SearchResult } from '../types'

interface Toast {
  id: string
  message: string
}

interface AppContextValue {
  cart: CartItem[]
  cartCount: number
  cartSubtotal: number
  addToCart: (product: Product, quantity?: number, size?: string) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  favorites: string[]
  toggleFavorite: (productId: string) => void
  isFavorite: (productId: string) => boolean
  isCartOpen: boolean
  openCart: () => void
  closeCart: () => void
  isSearchOpen: boolean
  openSearch: () => void
  closeSearch: () => void
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: SearchResult[]
  toasts: Toast[]
  showToast: (message: string) => void
  couponCode: string
  setCouponCode: (code: string) => void
  couponDiscount: number
  applyCoupon: () => boolean
}

const AppContext = createContext<AppContextValue | null>(null)

const VALID_COUPONS: Record<string, number> = {
  VERISSIMO10: 0.1,
  PRATA15: 0.15,
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('verissimo-favorites')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [toasts, setToasts] = useState<Toast[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)

  const showToast = useCallback((message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const addToCart = useCallback(
    (product: Product, quantity = 1, selectedSize?: string) => {
      setCart((prev) => {
        const existing = prev.find(
          (item) =>
            item.product.id === product.id &&
            item.selectedSize === selectedSize
        )
        if (existing) {
          return prev.map((item) =>
            item.product.id === product.id &&
            item.selectedSize === selectedSize
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        }
        return [...prev, { product, quantity, selectedSize }]
      })
      showToast(`${product.name} adicionado ao carrinho`)
    },
    [showToast]
  )

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }, [])

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId)
        return
      }
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        )
      )
    },
    [removeFromCart]
  )

  const clearCart = useCallback(() => setCart([]), [])

  const toggleFavorite = useCallback((productId: string) => {
    setFavorites((prev) => {
      const next = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
      localStorage.setItem('verissimo-favorites', JSON.stringify(next))
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites]
  )

  const applyCoupon = useCallback(() => {
    const discount = VALID_COUPONS[couponCode.toUpperCase()]
    if (discount) {
      setCouponDiscount(discount)
      showToast('Cupom aplicado com sucesso!')
      return true
    }
    showToast('Cupom inválido')
    return false
  }, [couponCode, showToast])

  const searchResults = useMemo((): SearchResult[] => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return []

    const results: SearchResult[] = []

    categories.forEach((cat) => {
      if (
        cat.name.toLowerCase().includes(q) ||
        cat.slug.includes(q)
      ) {
        results.push({
          type: 'category',
          id: cat.slug,
          label: cat.name,
          href: `/produtos?categoria=${cat.slug}`,
          image: cat.image,
        })
      }
    })

    const matchedProducts = searchProducts(q)
    matchedProducts.forEach((p) => {
      results.push({
        type: 'product',
        id: p.id,
        label: p.name,
        href: `/produto/${p.slug}`,
        image: p.images[0],
        price: p.salePrice ?? p.price,
      })
    })

    const suggestions = ['anel', 'brinco', 'colar', 'pulseira', 'berloque', 'conjunto']
    suggestions
      .filter((s) => s.includes(q) && !results.some((r) => r.label.toLowerCase().includes(s)))
      .forEach((s) => {
        results.push({
          type: 'suggestion',
          id: s,
          label: `Buscar "${s}"`,
          href: `/produtos?q=${s}`,
        })
      })

    return results.slice(0, 8)
  }, [searchQuery])

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.product.salePrice ?? item.product.price
    return sum + price * item.quantity
  }, 0)

  const value: AppContextValue = {
    cart,
    cartCount,
    cartSubtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    favorites,
    toggleFavorite,
    isFavorite,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    isSearchOpen,
    openSearch: () => setIsSearchOpen(true),
    closeSearch: () => {
      setIsSearchOpen(false)
      setSearchQuery('')
    },
    searchQuery,
    setSearchQuery,
    searchResults,
    toasts,
    showToast,
    couponCode,
    setCouponCode,
    couponDiscount,
    applyCoupon,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

