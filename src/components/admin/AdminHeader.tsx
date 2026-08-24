import { Menu, Bell } from 'lucide-react'
import { Link } from 'react-router-dom'

interface AdminHeaderProps {
  onMenuClick: () => void
  title?: string
}

export function AdminHeader({ onMenuClick, title }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-cream/90 backdrop-blur-md border-b border-border/60 px-4 sm:px-6 py-4 flex items-center justify-between lg:pl-6">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="lg:hidden touch-target text-graphite" aria-label="Menu">
          <Menu className="w-5 h-5" strokeWidth={1.5} />
        </button>
        {title && <h1 className="font-serif text-lg font-light text-graphite lg:hidden">{title}</h1>}
      </div>
      <div className="flex items-center gap-3">
        <button className="touch-target text-muted hover:text-graphite transition-colors relative" aria-label="Notificações">
          <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-graphite rounded-full" />
        </button>
        <Link to="/" target="_blank" className="hidden sm:inline admin-btn-secondary text-[10px] py-2">
          Ver loja
        </Link>
      </div>
    </header>
  )
}
