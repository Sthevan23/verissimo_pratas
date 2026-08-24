import { Helmet } from 'react-helmet-async'
import { Gem, Shield, Truck, MessageCircle } from 'lucide-react'
import { AnimateIn } from '../components/ui/AnimateIn'
import { Button } from '../components/ui/Button'

export function About() {
  return (
    <>
      <Helmet>
        <title>Sobre nós — Verissimo Pratas 925</title>
        <meta
          name="description"
          content="Conheça a história da Verissimo Pratas 925. Joias em prata 925 com garantia vitalícia, atendimento especializado e envio para todo o Brasil."
        />
      </Helmet>

      <div className="header-offset pb-16 sm:pb-20">
        {/* Hero */}
        <section className="container-brand mb-20 lg:mb-28">
          <AnimateIn className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-4">
              Nossa história
            </p>
            <h1 className="heading-display text-4xl lg:text-5xl text-graphite mb-6 leading-tight">
              Mais do que uma joia.<br />Uma história.
            </h1>
            <p className="text-lg text-warm-gray font-light leading-relaxed">
              A Verissimo Pratas nasceu da paixão por transformar prata 925 em peças
              que carregam significado. Cada joia é selecionada com rigor estético,
              cuidado artesanal e o compromisso de acompanhar você nos momentos
              mais importantes da vida.
            </p>
          </AnimateIn>
        </section>

        {/* Values */}
        <section className="bg-off-white/60 py-20 lg:py-28 mb-20">
          <div className="container-brand">
            <div className="grid md:grid-cols-3 gap-10 lg:gap-16">
              {[
                {
                  icon: Gem,
                  title: 'Prata 925 autêntica',
                  text: 'Todas as peças são fabricadas em prata 925 com certificado de garantia vitalícia.',
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
                    <h3 className="font-serif text-xl font-light mb-3">
                      {item.title}
                    </h3>
                    <p className="text-warm-gray font-light leading-relaxed">
                      {item.text}
                    </p>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contato" className="container-brand mb-20 scroll-mt-32">
          <AnimateIn className="max-w-2xl mx-auto text-center">
            <h2 className="heading-display text-3xl text-graphite mb-4">
              Fale conosco
            </h2>
            <p className="text-warm-gray font-light mb-8">
              Nossa equipe está pronta para ajudar você a encontrar a peça perfeita.
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

        {/* FAQ sections */}
        <section id="faq" className="container-brand max-w-3xl scroll-mt-32">
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

        {/* Hidden anchor sections for footer links */}
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
