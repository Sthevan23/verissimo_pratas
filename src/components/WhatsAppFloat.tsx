import { MessageCircle } from 'lucide-react'
import { whatsappLink } from '../data/contact'

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar no WhatsApp"
      className="fixed z-[60] bottom-5 right-4 sm:bottom-6 sm:right-6 w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
    >
      <MessageCircle className="w-7 h-7" strokeWidth={1.75} fill="currentColor" />
    </a>
  )
}
