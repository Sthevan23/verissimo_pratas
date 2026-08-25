import { STORE_COMMERCE } from '../data/commerce'

export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatInstallments(
  value: number,
  installments = STORE_COMMERCE.maxInstallments
): string {
  const installmentValue = value / installments
  return `${installments} x de ${formatPrice(installmentValue)} sem juros`
}

/** Preço à vista com desconto Pix */
export function calcPixPrice(
  value: number,
  percent = STORE_COMMERCE.cashDiscountPercent
): number {
  return Math.round(value * (1 - percent / 100) * 100) / 100
}

export function calcDiscount(price: number, salePrice: number): number {
  return Math.round(((price - salePrice) / price) * 100)
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
