/** Dados oficiais da loja — use em toda a vitrine */
export const STORE_CONTACT = {
  ownerName: 'Isadora Veríssimo de Araújo',
  cnpj: '62.289.838/0001-02',
  phoneDisplay: '(35) 99124-0681',
  phoneWhatsApp: '5535991240681',
  /** Link oficial do WhatsApp Business da loja */
  whatsappUrl:
    'https://api.whatsapp.com/message/UJC2GNIKLZX4K1?autoload=1&app_absent=0',
  email: 'verissimopratass@gmail.com',
  instagramUrl: 'https://www.instagram.com/verissimopratas',
  instagramHandle: '@verissimopratas',
  city: 'Boa Esperança',
} as const

export const whatsappLink = (text?: string) => {
  if (!text?.trim()) return STORE_CONTACT.whatsappUrl
  return `https://wa.me/${STORE_CONTACT.phoneWhatsApp}?text=${encodeURIComponent(text)}`
}
