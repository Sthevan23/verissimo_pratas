/** Regras comerciais da loja */
export const STORE_COMMERCE = {
  /** Parcelas no cartão sem juros */
  maxInstallments: 6,
  /** Desconto à vista (Pix) */
  cashDiscountPercent: 5,
  /** Frete grátis em Boa Esperança */
  freeShippingLocalMin: 159,
  /** Frete grátis pelos Correios (todo o Brasil) */
  freeShippingNationalMin: 499,
  /** Brinde: porta-joias */
  giftMin: 399,
  giftLabel: 'porta-joias',
} as const

export const PROMO_TICKER_ITEMS = [
  `Compras acima de R$ ${STORE_COMMERCE.giftMin.toFixed(0)} ganham ${STORE_COMMERCE.giftLabel}`,
  `Em até ${STORE_COMMERCE.maxInstallments}x sem juros no cartão`,
  `À vista ${STORE_COMMERCE.cashDiscountPercent}% de desconto`,
  `Boa Esperança: frete grátis acima de R$ ${STORE_COMMERCE.freeShippingLocalMin}`,
  `Correios: frete grátis acima de R$ ${STORE_COMMERCE.freeShippingNationalMin}`,
] as const
