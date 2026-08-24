import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { HelmetProvider } from 'react-helmet-async'
import { AppProvider } from './context/AppContext'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AdminToastProvider } from './context/AdminToastContext'
import { Layout } from './components/Layout'
import { AdminLayout } from './components/admin/AdminLayout'
import { ProtectedRoute } from './components/admin/ProtectedRoute'
import { Home } from './pages/Home'
import { Products } from './pages/Products'
import { ProductDetails } from './pages/ProductDetails'
import { Cart } from './pages/Cart'
import { About } from './pages/About'
import { AdminLogin } from './pages/admin/AdminLogin'
import { AdminDashboard } from './pages/admin/AdminDashboard'
import { AdminProducts } from './pages/admin/AdminProducts'
import { AdminProductForm } from './pages/admin/AdminProductForm'
import { AdminCategories } from './pages/admin/AdminCategories'
import { AdminOrders } from './pages/admin/AdminOrders'
import { AdminOrderDetail } from './pages/admin/AdminOrderDetail'
import { AdminCustomers, AdminCustomerDetail } from './pages/admin/AdminCustomers'
import { AdminInventory } from './pages/admin/AdminInventory'
import { AdminFinance } from './pages/admin/AdminFinance'
import { AdminCoupons } from './pages/admin/AdminCoupons'
import { AdminReviews } from './pages/admin/AdminReviews'
import { AdminReports } from './pages/admin/AdminReports'
import { AdminSettings, AdminUsers } from './pages/admin/AdminSettings'

function StoreRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Routes location={location}>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="produtos" element={<Products />} />
            <Route path="produto/:slug" element={<ProductDetails />} />
            <Route path="carrinho" element={<Cart />} />
            <Route path="sobre" element={<About />} />
          </Route>
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <AdminAuthProvider>
          <AdminToastProvider>
            <Routes>
              {/* Admin — public login */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin — protected */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<ProtectedRoute module="dashboard"><AdminDashboard /></ProtectedRoute>} />
                <Route path="produtos" element={<ProtectedRoute module="products"><AdminProducts /></ProtectedRoute>} />
                <Route path="produtos/novo" element={<ProtectedRoute module="products"><AdminProductForm /></ProtectedRoute>} />
                <Route path="produtos/:id" element={<ProtectedRoute module="products"><AdminProductForm /></ProtectedRoute>} />
                <Route path="categorias" element={<ProtectedRoute module="categories"><AdminCategories /></ProtectedRoute>} />
                <Route path="pedidos" element={<ProtectedRoute module="orders"><AdminOrders /></ProtectedRoute>} />
                <Route path="pedidos/:id" element={<ProtectedRoute module="orders"><AdminOrderDetail /></ProtectedRoute>} />
                <Route path="clientes" element={<ProtectedRoute module="customers"><AdminCustomers /></ProtectedRoute>} />
                <Route path="clientes/:id" element={<ProtectedRoute module="customers"><AdminCustomerDetail /></ProtectedRoute>} />
                <Route path="estoque" element={<ProtectedRoute module="inventory"><AdminInventory /></ProtectedRoute>} />
                <Route path="financeiro" element={<ProtectedRoute module="finance"><AdminFinance /></ProtectedRoute>} />
                <Route path="cupons" element={<ProtectedRoute module="coupons"><AdminCoupons /></ProtectedRoute>} />
                <Route path="avaliacoes" element={<ProtectedRoute module="reviews"><AdminReviews /></ProtectedRoute>} />
                <Route path="relatorios" element={<ProtectedRoute module="reports"><AdminReports /></ProtectedRoute>} />
                <Route path="configuracoes" element={<ProtectedRoute module="settings"><AdminSettings /></ProtectedRoute>} />
                <Route path="usuarios" element={<ProtectedRoute module="users"><AdminUsers /></ProtectedRoute>} />
              </Route>

              {/* Storefront */}
              <Route
                path="/*"
                element={
                  <AppProvider>
                    <StoreRoutes />
                  </AppProvider>
                }
              />
            </Routes>
          </AdminToastProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
