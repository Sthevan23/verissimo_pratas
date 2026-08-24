import { Helmet } from 'react-helmet-async'
import { ChevronDown, Gem, MessageCircle, Shield, Truck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Button } from '../components/ui/Button'

const storyParagraphs = [
  'Seja muito bem-vinda à nossa marca!',
  'Meu nome é Isadora Veríssimo, nasci em São Paulo, capital, e desde sempre tive vontade de conquistar minha independência e construir algo que fosse meu.',
  'Meus pais são comerciantes, então cresci acompanhando de perto o mundo das vendas. Desde pequena, sempre tive essa visão de comércio e aprendi muito observando o trabalho e a dedicação deles. Quando pensei em como poderia começar a construir minha própria história, tive o apoio da minha família para dar o primeiro passo.',
  'Foi assim que comecei a vender peças em Prata 925, que desde o início se tornaram o meu grande foco e continuam sendo a essência da nossa marca até hoje.',
  'Já são 3 anos no comércio, construindo tudo com muito carinho, dedicação e, principalmente, com o apoio de pessoas que sempre acreditaram em mim. Hoje, nossa história tem como foco principal a cidade de Boa Esperança, lugar onde moro atualmente e onde tenho a alegria de compartilhar nosso trabalho com tantas pessoas especiais.',
  'Olho para tudo que construímos até aqui e tenho certeza de que foi uma das melhores escolhas que eu poderia ter feito. Hoje me sinto realizada por poder trabalhar com algo que amo e, ao mesmo tempo, proporcionar a vocês peças que carregam beleza, delicadeza e significado.',
  'Cada peça em Prata 925 é escolhida e pensada com muito carinho para vocês, para que possam encontrar aqui não apenas uma joia, mas algo que faça parte da sua história.',
  'Espero, de coração, que vocês também possam se sentir realizadas, confiantes e especiais usando nossas peças, assim como eu me sinto realizando esse sonho todos os dias.',
  'Obrigada por fazerem parte da nossa história. Ela também é feita por vocês.',
]

export function About() {
  const [storyOpen, setStoryOpen] = useState(false)
  const storyRef = useRef<HTMLElement>(null)
  const location = useLocation()

  const openStory = (scroll = true) => {
    setStoryOpen(true)
    if (scroll) {
      requestAnimationFrame(() => {
        storyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }
  }

  // Abre ao chegar no final da página (ou ao abrir /sobre#historia)
  useEffect(() => {
    const el = storyRef.current
    if (!el) return

    if (location.hash === '#historia') {
      openStory(true)
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStoryOpen(true)
      },
      { threshold: 0.35, rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [location.hash])

  return (
    <>
      <Helmet>
        <title>Sobre nós — Verissimo Pratas 925</title>
        <meta
          name="description"
          content="Conheça Isadora Veríssimo e a história da Verissimo Pratas 925. Joias em prata 925 com garantia vitalícia, de Boa Esperança para todo o Brasil."
        />
      </Helmet>

      <div className="header-offset pb-16 sm:pb-20">
        <section className="container-brand mb-16 lg:mb-24">
          <AnimateIn className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-4">
              Sobre nós
            </p>
            <h1 className="heading-display text-4xl lg:text-5xl text-graphite mb-6 leading-tight overflow-visible">
              Verissimo Pratas 925
            </h1>
            <p className="text-lg text-warm-gray font-light leading-relaxed mb-8">
              Joias em prata 925 pensadas com carinho — da cidade de Boa Esperança
              para quem busca beleza, delicadeza e significado.
            </p>
            <button
              type="button"
              onClick={() => openStory(true)}
              className="inline-flex items-center gap-2 text-[11px] tracking-[0.2em] uppercase text-graphite border-b border-graphite/40 pb-1 hover:border-graphite transition-colors"
            >
              Ler minha história
              <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </AnimateIn>
        </section>

        <section className="bg-off-white/60 py-16 lg:py-24 mb-16 lg:mb-20">
          <div className="container-brand">
            <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
              {[
                {
                  icon: Gem,
                  title: 'Prata 925 autêntica',
                  text: 'Todas as peças são em prata 925 com certificado de garantia vitalícia.',
                },
                {
                  icon: Shield,
                  title: 'Compra segura',
                  text: 'Ambiente protegido com as melhores formas de pagamento e proteção ao consumidor.',
                },
                {
                  icon: Truck,
                  title: 'Envio nacional',
                  text: 'Entregamos para todo o Brasil com rastreamento. Frete grátis acima de R$349.',
                },
              ].map((item, i) => (
                <AnimateIn key={item.title} delay={i * 0.1}>
                  <div className="text-center">
                    <item.icon
                      className="w-8 h-8 text-silver-dark mx-auto mb-4"
                      strokeWidth={1.5}
                    />
                    <h3 className="font-serif text-xl font-light mb-3">{item.title}</h3>
                    <p className="text-warm-gray font-light leading-relaxed">{item.text}</p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="container-brand mb-16 lg:mb-20 scroll-mt-32">
          <AnimateIn className="max-w-2xl mx-auto text-center">
            <h2 className="heading-display text-3xl text-graphite mb-4">Fale conosco</h2>
            <p className="text-warm-gray font-light mb-8">
              Estamos prontas para ajudar você a encontrar a peça perfeita.
            </p>
            <a
              href="https://wa.me/5519995626888"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="inline-flex items-center gap-2">
                <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                WhatsApp
              </Button>
            </a>
          </AnimateIn>
        </section>

        <section id="faq" className="container-brand max-w-3xl mb-16 lg:mb-24 scroll-mt-32">
          <AnimateIn>
            <h2 className="heading-display text-2xl text-graphite mb-8 text-center">
              Perguntas frequentes
            </h2>
            <div className="space-y-6">
              {faqItems.map((item) => (
                <div key={item.q} className="border-b border-border pb-6">
                  <h3 className="font-serif text-lg font-light mb-2">{item.q}</h3>
                  <p className="text-warm-gray font-light leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </section>

        {/* História — só aparece ao clicar ou ao rolar até aqui */}
        <section
          id="historia"
          ref={storyRef}
          className="container-brand max-w-3xl scroll-mt-32 border-t border-border pt-12 lg:pt-16"
        >
          <button
            type="button"
            onClick={() => setStoryOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-4 text-left group"
            aria-expanded={storyOpen}
          >
            <div>
              <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-2">
                Isadora Veríssimo
              </p>
              <h2 className="heading-display text-3xl lg:text-4xl text-graphite overflow-visible">
                Minha história
              </h2>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-muted shrink-0 transition-transform duration-300 ${
                storyOpen ? 'rotate-180' : ''
              }`}
              strokeWidth={1.5}
            />
          </button>

          <div
            className={`grid transition-[grid-template-rows] duration-500 ease-out ${
              storyOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
            }`}
          >
            <div className="overflow-hidden">
              <div className="pt-8 sm:pt-10 space-y-5">
                {storyParagraphs.map((p) => (
                  <p
                    key={p.slice(0, 40)}
                    className="text-base sm:text-lg text-warm-gray font-light leading-relaxed"
                  >
                    {p}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {!storyOpen && (
            <p className="mt-4 text-sm text-muted font-light">
              Toque acima ou continue rolando para ler a história completa.
            </p>
          )}
        </section>

        <div id="trocas" className="scroll-mt-32" />
        <div id="pagamento" className="scroll-mt-32" />
        <div id="entrega" className="scroll-mt-32" />
        <div id="privacidade" className="scroll-mt-32" />
        <div id="termos" className="scroll-mt-32" />
      </div>
    </>
  )
}

const faqItems = [
  {
    q: 'As peças são de prata 925?',
    a: 'Sim, todas as joias Verissimo são fabricadas em prata 925 autêntica e acompanham certificado de garantia vitalícia.',
  },
  {
    q: 'Qual o prazo de envio?',
    a: 'O envio é realizado em até 24 horas úteis após a confirmação do pagamento. O prazo de entrega varia conforme a região.',
  },
  {
    q: 'Como funciona a troca?',
    a: 'Você tem até 7 dias após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Aceitamos cartão de crédito (até 3x sem juros), Pix com 5% de desconto e boleto bancário.',
  },
]
