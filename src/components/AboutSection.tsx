import { Link } from 'react-router-dom'
import { Button } from './ui/Button'
import { AnimateIn } from './ui/AnimateIn'
import { Logo } from './Logo'

export function AboutSection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container-brand">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <AnimateIn direction="left">
            <div className="relative aspect-[4/5] bg-off-white overflow-hidden max-w-lg mx-auto lg:mx-0">
              <img
                src="/categories/conjuntos.png"
                alt="Verissimo Pratas — joias em prata 925"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute bottom-6 left-6 bg-cream/90 backdrop-blur-sm px-5 py-3">
                <Logo variant="light" />
              </div>
            </div>
          </AnimateIn>

          <AnimateIn direction="right" delay={0.2}>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-4">
              Nossa essência
            </p>
            <h2 className="heading-display text-3xl lg:text-4xl text-graphite mb-6 leading-tight">
              Mais do que uma joia.<br />Uma história.
            </h2>
            <div className="space-y-4 text-warm-gray font-light leading-relaxed">
              <p>
                A Verissimo Pratas é o sonho de Isadora Veríssimo — 3 anos dedicados
                à prata 925, com carinho, dedicação e o apoio de quem sempre
                acreditou nessa história.
              </p>
              <p>
                De Boa Esperança para todo o Brasil: peças escolhidas para carregar
                beleza, delicadeza e significado na sua história também.
              </p>
            </div>
            <div className="mt-8">
              <Link to="/sobre#historia">
                <Button variant="outline">Ler minha história</Button>
              </Link>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  )
}
