import { Helmet } from 'react-helmet-async'
import { ChevronDown, Gem, MessageCircle, Shield, Truck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
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

const benefits = [
  {
    icon: Gem,
    title: 'Prata 925 autêntica',
    text: 'Garantia vitalícia em todas as peças.',
  },
  {
    icon: Shield,
    title: 'Compra segura',
    text: 'Pagamento protegido e atendimento próximo.',
  },
  {
    icon: Truck,
    title: 'Envio nacional',
    text: 'Para todo o Brasil. Frete grátis acima de R$349.',
  },
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
        {/* Hero — primeira tela com foto + marca */}
        <section className="relative min-h-[70vh] lg:min-h-[calc(100dvh-var(--header-height))] flex items-end lg:items-center overflow-hidden bg-off-white">
          <div className="absolute inset-0">
            <img
              src="/products/conjunto-halo-cravejado.png"
              alt="Joias Verissimo Pratas 925"
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-cream via-cream/85 to-cream/40 lg:bg-gradient-to-r lg:from-cream lg:via-cream/90 lg:to-cream/20" />
          </div>

          <div className="relative container-brand w-full py-12 sm:py-16 lg:py-20">
            <AnimateIn className="max-w-xl">
              <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3">
                Sobre nós · Isadora Veríssimo
              </p>
              <h1 className="heading-display text-4xl sm:text-5xl lg:text-6xl text-graphite mb-4 leading-tight overflow-visible">
                Verissimo
                <span className="block text-3xl sm:text-4xl lg:text-5xl mt-1 font-light tracking-[0.08em]">
                  Pratas 925
                </span>
              </h1>
              <p className="text-base sm:text-lg text-warm-gray font-light leading-relaxed mb-8 max-w-md">
                3 anos de prata 925, de Boa Esperança para todo o Brasil — peças
                com beleza, delicadeza e significado.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button type="button" onClick={() => openStory(true)}>
                  <Button size="lg" className="w-full sm:w-auto inline-flex items-center gap-2">
                    Ler minha história
                    <ChevronDown className="w-4 h-4" strokeWidth={1.5} />
                  </Button>
                </button>
                <Link to="/produtos">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Ver coleção
                  </Button>
                </Link>
              </div>
            </AnimateIn>
          </div>
        </section>

        <section className="border-y border-border bg-cream">
          <div className="container-brand py-6 sm:py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {benefits.map(({ icon: Icon, title, text }) => (
                <div key={title} className="flex items-start gap-3">
                  <Icon className="w-5 h-5 text-silver-dark shrink-0 mt-0.5" strokeWidth={1.5} />
                  <div>
                    <p className="text-sm text-graphite mb-0.5">{title}</p>
                    <p className="text-sm text-warm-gray font-light leading-snug">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contato" className="container-brand py-16 lg:py-20 scroll-mt-32">
          <AnimateIn className="max-w-2xl mx-auto text-center">
            <h2 className="heading-display text-3xl text-graphite mb-4 overflow-visible">
              Fale conosco
            </h2>
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
            <h2 className="heading-display text-2xl text-graphite mb-8 text-center overflow-visible">
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

        <section
          id="garantia"
          className="container-brand max-w-3xl mb-16 lg:mb-24 scroll-mt-32"
        >
          <AnimateIn>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3 text-center">
              Informações importantes
            </p>
            <h2 className="heading-display text-3xl lg:text-4xl text-graphite mb-10 text-center overflow-visible">
              Garantia e cuidados
            </h2>

            <div className="space-y-10 text-warm-gray font-light leading-relaxed">
              <div>
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  Nossa garantia
                </h3>
                <p className="mb-3">
                  Todas as nossas peças são confeccionadas em Prata 925 e possuem
                  garantia vitalícia quanto à autenticidade do material.
                </p>
                <p>
                  Além disso, nossa garantia cobre defeitos de fabricação
                  identificados em até 7 dias após a compra.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  A prata 925 pode escurecer?
                </h3>
                <p className="mb-3">Sim. E isso é completamente normal.</p>
                <p className="mb-3">
                  A Prata 925 é uma liga composta principalmente por prata, e,
                  por ser um metal que reage com o ambiente, pode apresentar
                  escurecimento ao longo do tempo. O contato com umidade, suor,
                  produtos químicos, poluição e substâncias que contêm enxofre
                  pode acelerar esse processo.
                </p>
                <p className="mb-3">
                  Esse escurecimento acontece na superfície da peça, formando
                  uma camada que altera temporariamente sua aparência. Por isso,
                  uma Prata 925 escurecida não significa que a peça seja falsa,
                  que perdeu sua qualidade ou que deixou de ser prata.
                </p>
                <p className="mb-3">
                  Com a limpeza e os cuidados corretos, o brilho pode ser
                  recuperado.
                </p>
                <p>
                  Por isso, não se preocupe caso sua peça escureça com o uso: a
                  oxidação é um processo natural da prata e faz parte dos
                  cuidados necessários para manter sua joia sempre bonita.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  O que a nossa garantia não cobre
                </h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Soldas ou alterações realizadas na peça</li>
                  <li>Perda de pedras</li>
                  <li>
                    Peças quebradas, amassadas ou riscadas decorrentes do uso
                  </li>
                  <li>Oxidação natural da Prata 925</li>
                </ul>
              </div>

              <div className="border border-border bg-off-white/50 px-5 py-6 sm:px-6">
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  Precisou de limpeza ou conserto?
                </h3>
                <p className="mb-4">
                  Conte com a nossa assistência. Oferecemos limpeza e assistência
                  para consertos das peças, sempre buscando deixar sua joia linda
                  novamente.
                </p>
                <a
                  href="https://wa.me/5519995626888"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex text-[11px] tracking-[0.15em] uppercase text-graphite border-b border-graphite/40 pb-0.5 hover:border-graphite transition-colors"
                >
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </AnimateIn>
        </section>

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
        <div id="cuidados" className="scroll-mt-32" />
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
    q: 'A prata 925 pode escurecer?',
    a: 'Sim, e isso é normal. A oxidação é um processo natural da prata. Com limpeza e cuidados corretos, o brilho pode ser recuperado. Veja mais em Garantia e cuidados.',
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
