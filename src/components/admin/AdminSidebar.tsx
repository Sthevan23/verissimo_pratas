import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  Warehouse,
  Wallet,
  Ticket,
  Star,
  BarChart3,
  Settings,
  UserCog,
  LogOut,
  ExternalLink,
  X,
} from 'lucide-react'
import { useAdminAuth } from '../../context/AdminAuthContext'

const menuItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', module: 'dashboard' },
  { to: '/admin/produtos', icon: Package, label: 'Produtos', module: 'products' },
  { to: '/admin/categorias', icon: FolderTree, label: 'Página inicial', module: 'categories' },
  { to: '/admin/pedidos', icon: ShoppingCart, label: 'Pedidos', module: 'orders' },
  { to: '/admin/clientes', icon: Users, label: 'Clientes', module: 'customers' },
  { to: '/admin/estoque', icon: Warehouse, label: 'Estoque', module: 'inventory' },
  { to: '/admin/financeiro', icon: Wallet, label: 'Financeiro', module: 'finance' },
  { to: '/admin/cupons', icon: Ticket, label: 'Cupons', module: 'coupons' },
  { to: '/admin/avaliacoes', icon: Star, label: 'Avaliações', module: 'reviews' },
  { to: '/admin/relatorios', icon: BarChart3, label: 'Relatórios', module: 'reports' },
  { to: '/admin/configuracoes', icon: Settings, label: 'Configurações', module: 'settings' },
  { to: '/admin/usuarios', icon: UserCog, label: 'Usuários', module: 'users' },
]

interface AdminSidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function AdminSidebar({ mobile, onClose }: AdminSidebarProps) {
  const { session, logout, canAccess } = useAdminAuth()

  return (
    <aside className={`flex flex-col h-full bg-white border-r border-border ${mobile ? 'w-full' : 'w-64 shrink-0'}`}>
      <div className="px-6 py-6 border-b border-border/60 flex items-center justify-between">
        <div>
          <span className="font-serif text-xl font-light tracking-tight text-graphite">VP</span>
          <span className="block text-[9px] tracking-[0.35em] uppercase text-muted mt-0.5">Admin</span>
        </div>
        {mobile && onClose && (
          <button onClick={onClose} className="p-2 lg:hidden" aria-label="Fechar menu">
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {menuItems.map(({ to, icon: Icon, label, module }) => {
          if (!canAccess(module)) return null
          return (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 mb-0.5 text-[15px] font-normal transition-colors ${
                  isActive
                    ? 'bg-graphite text-cream'
                    : 'text-warm-gray hover:bg-off-white hover:text-graphite'
                }`
              }
            >
              <Icon className="w-5 h-5 shrink-0" strokeWidth={1.5} />
              {label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-border/60 p-4">
        <div className="px-3 py-2 mb-2">
          <p className="text-[15px] font-medium text-graphite truncate">{session?.name}</p>
          <p className="text-xs text-muted truncate capitalize">{session?.role}</p>
        </div>
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 w-full px-3 py-3 text-[15px] font-normal text-warm-gray hover:bg-off-white hover:text-graphite transition-colors"
        >
          <ExternalLink className="w-5 h-5" strokeWidth={1.5} />
          Ir para o site
        </a>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-3 text-[15px] font-normal text-warm-gray hover:bg-off-white hover:text-graphite transition-colors"
        >
          <LogOut className="w-5 h-5" strokeWidth={1.5} />
          Sair
        </button>
      </div>
    </aside>
  )
}
