import { Helmet } from 'react-helmet-async'
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { formatPrice } from '../utils/format'
import { Button } from '../components/ui/Button'
import { AnimateIn } from '../components/ui/AnimateIn'

export function Cart() {
  const {
    cart,
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
    <>
      <Helmet>
        <title>Carrinho — Verissimo Pratas 925</title>
      </Helmet>

      <div className="pt-28 lg:pt-32 pb-20">
        <div className="container-brand max-w-4xl">
          <AnimateIn>
            <h1 className="heading-display text-3xl lg:text-4xl text-graphite mb-10 text-center">
              Seu carrinho
            </h1>
          </AnimateIn>

          {cart.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-border mx-auto mb-6" strokeWidth={1} />
              <p className="text-warm-gray font-light mb-8">
                Seu carrinho está vazio
              </p>
              <Link to="/produtos">
                <Button size="lg">Explorar coleção</Button>
              </Link>
            </div>
          ) : (
            <div className="grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-16">
              <div className="space-y-6">
                {cart.map((item) => {
                  const price = item.product.salePrice ?? item.product.price
                  return (
                    <AnimateIn key={`${item.product.id}-${item.selectedSize}`}>
                      <div className="flex gap-5 pb-6 border-b border-border">
                        <Link
                          to={`/produto/${item.product.slug}`}
                          className="w-28 h-32 bg-off-white shrink-0 overflow-hidden"
                        >
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </Link>
                        <div className="flex-1">
                          <Link
                            to={`/produto/${item.product.slug}`}
                            className="text-base font-light text-graphite hover:text-charcoal"
                          >
                            {item.product.name}
                          </Link>
                          {item.selectedSize && (
                            <p className="text-sm text-muted mt-1">
                              Tamanho: {item.selectedSize}
                            </p>
                          )}
                          <p className="text-base font-medium mt-2">
                            {formatPrice(price)}
                          </p>
                          <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center border border-border">
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity - 1)
                                }
                                className="p-2 hover:bg-off-white"
                                aria-label="Diminuir"
                              >
                                <Minus className="w-4 h-4" strokeWidth={1.5} />
                              </button>
                              <span className="px-4 text-sm">{item.quantity}</span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.product.id, item.quantity + 1)
                                }
                                className="p-2 hover:bg-off-white"
                                aria-label="Aumentar"
                              >
                                <Plus className="w-4 h-4" strokeWidth={1.5} />
                              </button>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="flex items-center gap-1.5 text-sm text-muted hover:text-graphite transition-colors"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                              Remover
                            </button>
                          </div>
                        </div>
                        <p className="text-base font-medium hidden sm:block">
                          {formatPrice(price * item.quantity)}
                        </p>
                      </div>
                    </AnimateIn>
                  )
                })}
              </div>

              <AnimateIn delay={0.2}>
                <div className="bg-off-white/60 p-6 lg:p-8 h-fit lg:sticky lg:top-32">
                  <h2 className="font-serif text-xl font-light mb-6">Resumo</h2>

                  <div className="flex gap-2 mb-6">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Cupom de desconto"
                      className="flex-1 px-4 py-3 border border-border text-sm font-light bg-cream focus:outline-none focus:border-graphite"
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-4 py-3 border border-graphite text-[10px] tracking-widest uppercase hover:bg-graphite hover:text-cream transition-colors"
                    >
                      Aplicar
                    </button>
                  </div>

                  <div className="space-y-3 text-sm mb-6">
                    <div className="flex justify-between font-light">
                      <span className="text-warm-gray">Subtotal</span>
                      <span>{formatPrice(cartSubtotal)}</span>
                    </div>
                    {couponDiscount > 0 && (
                      <div className="flex justify-between font-light text-green-700">
                        <span>Desconto ({Math.round(couponDiscount * 100)}%)</span>
                        <span>-{formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-light">
                      <span className="text-warm-gray">Frete</span>
                      <span>
                        {shipping === 0 ? 'Grátis' : formatPrice(shipping)}
                      </span>
                    </div>
                    {cartSubtotal < 349 && (
                      <p className="text-[11px] text-muted">
                        Frete grátis em compras acima de R$349
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between font-medium text-lg pt-4 border-t border-border mb-6">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>

                  <Button className="w-full" size="lg">
                    Finalizar compra
                  </Button>

                  <Link
                    to="/produtos"
                    className="block text-center text-[11px] tracking-widest uppercase text-muted hover:text-graphite mt-4 transition-colors"
                  >
                    Continuar comprando
                  </Link>
                </div>
              </AnimateIn>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
