import { AnimatePresence, motion } from 'framer-motion'
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatPrice } from '../utils/format'
import { Button } from './ui/Button'

export function CartDrawer() {
  const {
    cart,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    cartSubtotal,
    couponCode,
    setCouponCode,
    applyCoupon,
    couponDiscount,
  } = useApp()

  const discount = cartSubtotal * couponDiscount
  const shipping = cartSubtotal >= 349 ? 0 : cartSubtotal > 0 ? 19.9 : 0
  const total = cartSubtotal - discount + shipping

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-graphite/40 z-[80]"
            onClick={closeCart}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-cream z-[90] flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                <h2 className="font-serif text-xl font-light">Carrinho</h2>
                {cart.length > 0 && (
                  <span className="text-xs text-muted">({cart.length})</span>
                )}
              </div>
              <button onClick={closeCart} aria-label="Fechar carrinho">
                <X className="w-5 h-5" strokeWidth={1.5} />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <ShoppingBag className="w-12 h-12 text-border mb-4" strokeWidth={1} />
                <p className="text-warm-gray font-light mb-6">
                  Seu carrinho está vazio
                </p>
                <Link to="/produtos" onClick={closeCart}>
                  <Button>Explorar coleção</Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {cart.map((item) => {
                    const price = item.product.salePrice ?? item.product.price
                    return (
                      <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-4">
                        <Link
                          to={`/produto/${item.product.slug}`}
                          onClick={closeCart}
                          className="w-24 h-28 bg-off-white shrink-0 overflow-hidden"
                        >
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/produto/${item.product.slug}`}
                            onClick={closeCart}
                            className="text-sm font-light text-graphite hover:text-charcoal line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          {item.selectedSize && (
                            <p className="text-xs text-muted mt-0.5">
                              Tamanho: {item.selectedSize}
                            </p>
                          )}
                          <p className="text-sm font-medium mt-1">
                            {formatPrice(price)}
                          </p>
                          <div className="flex items-center gap-3 mt-3">
                            <div className="flex items-center border border-border">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity - 1)
                                }
                                className="p-1.5 hover:bg-off-white transition-colors"
                                aria-label="Diminuir quantidade"
                              >
                                <Minus className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                              <span className="px-3 text-sm">{item.quantity}</span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity + 1)
                                }
                                className="p-1.5 hover:bg-off-white transition-colors"
                                aria-label="Aumentar quantidade"
                              >
                                <Plus className="w-3 h-3" strokeWidth={1.5} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="p-1.5 text-muted hover:text-graphite transition-colors"
                              aria-label="Remover item"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="border-t border-border p-6 space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Cupom de desconto"
                      className="flex-1 px-4 py-2.5 border border-border text-sm font-light focus:outline-none focus:border-graphite"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-2.5 border border-graphite text-[10px] tracking-widest uppercase hover:bg-graphite hover:text-cream transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between font-light">
                      <span className="text-warm-gray">Subtotal</span>
                      <span>{formatPrice(cartSubtotal)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between font-light text-green-700">
                        <span>Desconto</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-light">
                      <span className="text-warm-gray">Frete</span>
                      <span>
                        {shipping === 0 && cartSubtotal > 0
                          ? 'Grátis'
                          : cartSubtotal > 0
                            ? formatPrice(shipping)
                            : '—'}
                      </span>
                    </div>
                    {cartSubtotal > 0 && cartSubtotal < 349 && (
                      <p className="text-[11px] text-muted">
                        Frete grátis em compras acima de R$349
                      </p>
                    )}
                    <div className="flex justify-between font-medium pt-2 border-t border-border">
                      <span>Total</span>
                      <span>{formatPrice(total)}</span>
                    </div>
                  </div>

                  <Link to="/carrinho" onClick={closeCart} className="block">
                    <Button className="w-full" size="lg">
                      Finalizar compra
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
