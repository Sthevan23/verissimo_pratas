import { MousePointerClick, CreditCard, Package, Sparkles } from 'lucide-react'
import { AnimateIn } from './ui/AnimateIn'

const steps = [
  {
    icon: MousePointerClick,
    title: 'Escolha sua peça',
    description: 'Explore nossa coleção e encontre a joia perfeita para você.',
  },
  {
    icon: CreditCard,
    title: 'Finalize seu pedido',
    description: 'Pagamento seguro com parcelamento em até 3x sem juros.',
  },
  {
    icon: Package,
    title: 'Receba em sua casa',
    description: 'Envio rápido para todo o Brasil com rastreamento.',
  },
  {
    icon: Sparkles,
    title: 'Viva seu momento',
    description: 'Desfrute de uma peça feita para durar para sempre.',
  },
]

export function ShoppingExperience() {
  return (
    <section className="py-20 lg:py-28 bg-graphite text-cream">
      <div className="container-brand">
        <AnimateIn className="text-center mb-14 lg:mb-16">
          <p className="text-[11px] tracking-[0.3em] uppercase text-silver-dark mb-3">
            Simples e seguro
          </p>
          <h2 className="heading-display text-3xl lg:text-4xl">
            Sua experiência de compra
          </h2>
        </AnimateIn>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {steps.map((step, i) => (
            <AnimateIn key={step.title} delay={i * 0.1}>
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center justify-center w-12 h-12 border border-silver-dark/30 mb-5">
                  <step.icon className="w-5 h-5 text-silver" strokeWidth={1.5} />
                </div>
                <span className="block text-[10px] tracking-[0.3em] text-silver-dark mb-2">
                  0{i + 1}
                </span>
                <h3 className="font-serif text-xl font-light mb-2">{step.title}</h3>
                <p className="text-sm text-silver-dark font-light leading-relaxed">
                  {step.description}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  )
}
