import { useState, type FormEvent } from 'react'
import { Button } from './ui/Button'
import { AnimateIn } from './ui/AnimateIn'
import { useApp } from '../context/AppContext'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const { showToast } = useApp()

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    showToast('Obrigada por se inscrever! Em breve você receberá nossas novidades.')
    setEmail('')
  }

  return (
    <section className="py-20 lg:py-28">
      <div className="container-brand">
        <AnimateIn>
          <div className="max-w-2xl mx-auto text-center border border-border px-8 py-14 lg:px-16 lg:py-16">
            <p className="text-[11px] tracking-[0.3em] uppercase text-muted mb-4">
              Newsletter
            </p>
            <h2 className="heading-display text-3xl lg:text-4xl text-graphite mb-4">
              Receba novidades da Verissimo
            </h2>
            <p className="text-warm-gray font-light mb-8 max-w-md mx-auto leading-relaxed">
              Cadastre-se e seja a primeira a conhecer nossas novas coleções,
              novidades e condições especiais.
            </p>

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                required
                className="flex-1 px-5 py-3.5 bg-cream border border-border text-sm font-light placeholder:text-muted focus:outline-none focus:border-graphite transition-colors"
                aria-label="E-mail para newsletter"
              />
              <Button type="submit" size="md" className="shrink-0">
                Inscrever-se
              </Button>
            </form>
          </div>
        </AnimateIn>
      </div>
    </section>
  )
}
