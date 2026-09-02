import { PROMO_TICKER_ITEMS } from '../data/commerce'

export function PromoTicker() {
  const sequence = [...PROMO_TICKER_ITEMS, ...PROMO_TICKER_ITEMS]

  return (
    <div
      className="relative z-40 overflow-hidden border-b border-brand-green/30 bg-brand-green text-white"
      role="region"
      aria-label="Promoções"
    >
      <div className="promo-ticker flex w-max whitespace-nowrap py-2.5 text-xs sm:text-sm tracking-[0.1em] uppercase font-normal text-white">
        {sequence.map((text, i) => (
          <span key={`${text}-${i}`} className="inline-flex items-center">
            <span className="px-5 sm:px-8">{text}</span>
            <span className="text-white/70" aria-hidden>
              ·
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}
