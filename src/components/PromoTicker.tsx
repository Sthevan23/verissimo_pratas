import { PROMO_TICKER_ITEMS } from '../data/commerce'

export function PromoTicker() {
  const sequence = [...PROMO_TICKER_ITEMS, ...PROMO_TICKER_ITEMS]

  return (
    <div
      className="relative z-40 overflow-hidden border-b border-border bg-graphite text-cream"
      role="region"
      aria-label="Promoções"
    >
      <div className="promo-ticker flex w-max whitespace-nowrap py-2.5 text-[10px] sm:text-[11px] tracking-[0.14em] uppercase font-light">
        {sequence.map((text, i) => (
          <span key={`${text}-${i}`} className="inline-flex items-center">
            <span className="px-5 sm:px-8">{text}</span>
            <span className="text-silver-dark/80" aria-hidden>
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
