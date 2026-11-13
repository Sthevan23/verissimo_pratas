import { MessageCircle } from 'lucide-react'
import { whatsappLink } from '../data/contact'

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed z-[60] bottom-4 right-3 sm:bottom-6 sm:right-6 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={1.75} fill="currentColor" />
    </a>
  )
}
