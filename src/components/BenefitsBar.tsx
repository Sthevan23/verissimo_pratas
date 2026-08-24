import { Shield, Truck, Headphones, Gem } from 'lucide-react'
import { AnimateIn } from './ui/AnimateIn'

const benefits = [
  { icon: Gem, text: 'Prata de alta qualidade' },
  { icon: Truck, text: 'Envio para todo o Brasil' },
  { icon: Shield, text: 'Compra segura' },
  { icon: Headphones, text: 'Atendimento especializado' },
]

export function BenefitsBar() {
  return (
    <section className="border-b border-border bg-off-white/50 header-offset">
      <div className="container-brand py-3 sm:py-3.5">
        <AnimateIn>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3 sm:gap-4 lg:gap-8">
            {benefits.map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-start sm:items-center justify-center gap-2 sm:gap-2.5 text-center sm:text-center px-1"
              >
                <Icon className="w-4 h-4 text-silver-dark shrink-0 mt-0.5 sm:mt-0" strokeWidth={1.5} />
                <span className="text-[10px] sm:text-[11px] lg:text-xs tracking-wide text-warm-gray font-light leading-snug">
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
