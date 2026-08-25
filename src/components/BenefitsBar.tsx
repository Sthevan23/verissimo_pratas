import { Shield, Truck, Headphones, Gem } from 'lucide-react'
import { AnimateIn } from './ui/AnimateIn'

const benefits = [
  { icon: Gem, text: 'Prata de alta qualidade' },
  { icon: Truck, text: 'Frete grátis — Correios acima de R$ 499' },
  { icon: Shield, text: 'Compra segura' },
  { icon: Headphones, text: 'Atendimento especializado' },
]

export function BenefitsBar() {
  return (
    <section className="border-b border-border bg-off-white/50 header-offset">
      <div className="container-brand py-3 sm:py-3.5">
        <AnimateIn>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-2.5 sm:gap-4 lg:gap-6">
            {benefits.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 min-h-[2rem]"
              >
                <Icon
                  className="w-4 h-4 text-silver-dark shrink-0"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="text-[10px] sm:text-[11px] lg:text-xs tracking-wide text-warm-gray font-light leading-tight text-left">
                  {text}
                </span>
              </div>
            ))}
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}
