import { Helmet } from 'react-helmet-async'
import { ChevronDown, Gem, MessageCircle, Shield, Truck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Button } from '../components/ui/Button'
import { STORE_CONTACT, whatsappLink } from '../data/contact'
import { STORE_COMMERCE } from '../data/commerce'

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
    text: `Boa Esperança acima de R$ ${STORE_COMMERCE.freeShippingLocalMin} · Correios acima de R$ ${STORE_COMMERCE.freeShippingNationalMin}.`,
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
          <AnimateIn className="max-w-2xl mx-auto">
            <h2 className="heading-display text-3xl text-graphite mb-8 text-center overflow-visible">
              Contato
            </h2>
            <div className="border border-border bg-off-white/40 px-6 py-8 space-y-3 text-warm-gray font-light">
              <p className="text-graphite font-medium text-base">
                {STORE_CONTACT.ownerName}
              </p>
              <p>CNPJ: {STORE_CONTACT.cnpj}</p>
              <p>
                Telefone/WhatsApp:{' '}
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-graphite underline underline-offset-2 hover:text-charcoal"
                >
                  {STORE_CONTACT.phoneDisplay}
                </a>
              </p>
              <p>
                E-mail:{' '}
                <a
                  href={`mailto:${STORE_CONTACT.email}`}
                  className="text-graphite underline underline-offset-2 hover:text-charcoal"
                >
                  {STORE_CONTACT.email}
                </a>
              </p>
              <p>
                Instagram:{' '}
                <a
                  href={STORE_CONTACT.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-graphite underline underline-offset-2 hover:text-charcoal"
                >
                  {STORE_CONTACT.instagramHandle}
                </a>
              </p>
            </div>
            <div className="mt-8 text-center">
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="inline-flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" strokeWidth={1.5} />
                  WhatsApp
                </Button>
              </a>
            </div>
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
                  href={whatsappLink()}
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

        <section
          id="privacidade"
          className="container-brand max-w-3xl mb-16 lg:mb-24 scroll-mt-32 border-t border-border pt-12 lg:pt-16"
        >
          <AnimateIn>
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-3 text-center">
              Última atualização: 24 de agosto de 2026
            </p>
            <h2 className="heading-display text-3xl lg:text-4xl text-graphite mb-8 text-center overflow-visible">
              Política de Privacidade
            </h2>

            <div className="space-y-8 text-warm-gray font-light leading-relaxed">
              <p>
                A Isadora Veríssimo de Araújo, CNPJ 62.289.838/0001-02, valoriza a
                privacidade e a segurança dos dados de nossas clientes e está
                comprometida com a proteção das informações pessoais, conforme a
                Lei Geral de Proteção de Dados (LGPD).
              </p>

              <div>
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  1. Dados coletados
                </h3>
                <p>
                  Podemos coletar informações necessárias para realizar compras,
                  entregas e atendimentos, como nome, CPF, telefone, e-mail,
                  endereço e dados relacionados ao pedido e pagamento.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  2. Como utilizamos seus dados
                </h3>
                <p className="mb-3">Seus dados são utilizados exclusivamente para:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Processar pedidos e pagamentos</li>
                  <li>Realizar entregas</li>
                  <li>Emitir notas fiscais</li>
                  <li>Prestar atendimento e suporte</li>
                  <li>Realizar trocas, garantias e assistência</li>
                  <li>Cumprir obrigações legais</li>
                  <li>Enviar comunicações, quando autorizado</li>
                </ul>
              </div>

              <div>
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  3. Compartilhamento
                </h3>
                <p className="mb-3">
                  Seus dados poderão ser compartilhados apenas quando necessário
                  com serviços de pagamento, entrega, plataformas utilizadas pela
                  loja e órgãos públicos, quando exigido por lei.
                </p>
                <p>Não vendemos ou comercializamos seus dados pessoais.</p>
              </div>

              <div>
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  4. Segurança
                </h3>
                <p>
                  Adotamos medidas para proteger suas informações contra acesso,
                  alteração ou uso indevido. Seus dados são mantidos apenas pelo
                  período necessário ou exigido pela legislação.
                </p>
              </div>

              <div>
                <h3 className="font-serif text-xl text-graphite font-light mb-3">
                  5. Seus direitos
                </h3>
                <p className="mb-3">
                  Você pode solicitar acesso, correção, atualização ou exclusão
                  dos seus dados, quando aplicável, além de outros direitos
                  previstos na LGPD.
                </p>
                <p className="mb-4">Para solicitações ou dúvidas:</p>
                <div className="border border-border bg-off-white/50 px-5 py-5 space-y-1 text-graphite">
                  <p className="font-medium">{STORE_CONTACT.ownerName}</p>
                  <p>CNPJ: {STORE_CONTACT.cnpj}</p>
                  <p>
                    Telefone/WhatsApp:{' '}
                    <a
                      href={whatsappLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-charcoal"
                    >
                      {STORE_CONTACT.phoneDisplay}
                    </a>
                  </p>
                  <p>
                    E-mail:{' '}
                    <a
                      href={`mailto:${STORE_CONTACT.email}`}
                      className="underline underline-offset-2 hover:text-charcoal"
                    >
                      {STORE_CONTACT.email}
                    </a>
                  </p>
                  <p>
                    Instagram:{' '}
                    <a
                      href={STORE_CONTACT.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-charcoal"
                    >
                      {STORE_CONTACT.instagramHandle}
                    </a>
                  </p>
                </div>
              </div>

              <p>
                Esta política poderá ser atualizada sempre que necessário para
                acompanhar mudanças em nossos serviços ou na legislação.
              </p>
            </div>
          </AnimateIn>
        </section>

        <section
          id="pagamento"
          className="container-brand max-w-3xl mb-16 lg:mb-20 scroll-mt-32 border-t border-border pt-12 lg:pt-16"
        >
          <AnimateIn>
            <h2 className="heading-display text-3xl text-graphite mb-8 text-center overflow-visible">
              Formas de pagamento
            </h2>
            <div className="space-y-4 text-warm-gray font-light leading-relaxed text-center sm:text-left max-w-xl mx-auto">
              <p>
                Em até <strong className="text-graphite font-medium">{STORE_COMMERCE.maxInstallments}x sem juros</strong> no
                cartão de crédito.
              </p>
              <p>
                À vista <strong className="text-graphite font-medium">{STORE_COMMERCE.cashDiscountPercent}% de desconto</strong>.
              </p>
            </div>
          </AnimateIn>
        </section>

        <section
          id="entrega"
          className="container-brand max-w-3xl mb-16 lg:mb-24 scroll-mt-32"
        >
          <AnimateIn>
            <h2 className="heading-display text-3xl text-graphite mb-8 text-center overflow-visible">
              Envios e frete
            </h2>
            <div className="space-y-4 text-warm-gray font-light leading-relaxed max-w-xl mx-auto">
              <p>
                Em <strong className="text-graphite font-medium">Boa Esperança</strong>, compras
                acima de R$ {STORE_COMMERCE.freeShippingLocalMin.toFixed(2).replace('.', ',')} com{' '}
                <strong className="text-graphite font-medium">frete grátis</strong>.
              </p>
              <p>
                Envio pelos <strong className="text-graphite font-medium">Correios</strong> para todo
                o Brasil: frete grátis acima de R${' '}
                {STORE_COMMERCE.freeShippingNationalMin.toFixed(2).replace('.', ',')}.
              </p>
              <p>
                Compras acima de R$ {STORE_COMMERCE.giftMin.toFixed(2).replace('.', ',')} ganham{' '}
                <strong className="text-graphite font-medium">{STORE_COMMERCE.giftLabel}</strong>.
              </p>
            </div>
          </AnimateIn>
        </section>

        <div id="trocas" className="scroll-mt-32" />
        <div id="cuidados" className="scroll-mt-32" />
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
    a: 'O envio é realizado em até 24 horas úteis após a confirmação do pagamento. Em Boa Esperança o frete é grátis acima de R$ 159,00; pelos Correios, acima de R$ 499,00.',
  },
  {
    q: 'Como funciona a troca?',
    a: 'Você tem até 7 dias após o recebimento para solicitar troca ou devolução, conforme o Código de Defesa do Consumidor.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'Cartão de crédito em até 6x sem juros e à vista com 5% de desconto.',
  },
]
