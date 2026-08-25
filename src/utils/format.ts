export function formatPrice(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

export function formatInstallments(value: number, installments = 6): string {
  const installmentValue = value / installments
  return `${installments}x de ${formatPrice(installmentValue)} sem juros`
}

export function calcDiscount(price: number, salePrice: number): number {
  return Math.round(((price - salePrice) / price) * 100)
}

export function cn(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
