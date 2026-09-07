import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AppProvider } from './context/AppContext'
import { CatalogHydrator } from './components/CatalogHydrator'
import { AdminAuthProvider } from './context/AdminAuthContext'
import { AdminToastProvider } from './context/AdminToastContext'
import { Layout } from './components/Layout'
import { ScrollToTop } from './components/ScrollToTop'
import { Home } from './pages/Home'
import { Products } from './pages/Products'
import { ProductDetails } from './pages/ProductDetails'
import { Cart } from './pages/Cart'
import { About } from './pages/About'

const AdminLogin = lazy(() =>
  import('./pages/admin/AdminLogin').then((m) => ({ default: m.AdminLogin }))
)
const AdminLayout = lazy(() =>
  import('./components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout }))
)
const ProtectedRoute = lazy(() =>
  import('./components/admin/ProtectedRoute').then((m) => ({ default: m.ProtectedRoute }))
)
const AdminDashboard = lazy(() =>
  import('./pages/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard }))
)
const AdminProducts = lazy(() =>
  import('./pages/admin/AdminProducts').then((m) => ({ default: m.AdminProducts }))
)
const AdminProductForm = lazy(() =>
  import('./pages/admin/AdminProductForm').then((m) => ({ default: m.AdminProductForm }))
)
const AdminCategories = lazy(() =>
  import('./pages/admin/AdminCategories').then((m) => ({ default: m.AdminCategories }))
)
const AdminOrders = lazy(() =>
  import('./pages/admin/AdminOrders').then((m) => ({ default: m.AdminOrders }))
)
const AdminOrderDetail = lazy(() =>
  import('./pages/admin/AdminOrderDetail').then((m) => ({ default: m.AdminOrderDetail }))
)
const AdminCustomers = lazy(() =>
  import('./pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomers }))
)
const AdminCustomerDetail = lazy(() =>
  import('./pages/admin/AdminCustomers').then((m) => ({ default: m.AdminCustomerDetail }))
)
const AdminInventory = lazy(() =>
  import('./pages/admin/AdminInventory').then((m) => ({ default: m.AdminInventory }))
)
const AdminFinance = lazy(() =>
  import('./pages/admin/AdminFinance').then((m) => ({ default: m.AdminFinance }))
)
const AdminCoupons = lazy(() =>
  import('./pages/admin/AdminCoupons').then((m) => ({ default: m.AdminCoupons }))
)
const AdminReviews = lazy(() =>
  import('./pages/admin/AdminReviews').then((m) => ({ default: m.AdminReviews }))
)
const AdminReports = lazy(() =>
  import('./pages/admin/AdminReports').then((m) => ({ default: m.AdminReports }))
)
const AdminSettings = lazy(() =>
  import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminSettings }))
)
const AdminUsers = lazy(() =>
  import('./pages/admin/AdminSettings').then((m) => ({ default: m.AdminUsers }))
)

function AdminFallback() {
  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-border border-t-graphite rounded-full animate-spin" />
    </div>
  )
}

function StoreRoutes() {
  const location = useLocation()
  return (
    <Routes location={location}>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="produtos" element={<Products />} />
        <Route path="produto/:slug" element={<ProductDetails />} />
        <Route path="carrinho" element={<Cart />} />
        <Route path="sobre" element={<About />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AdminAuthProvider>
          <AdminToastProvider>
            <Suspense fallback={<AdminFallback />}>
              <Routes>
                <Route path="/admin/login" element={<AdminLogin />} />

                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                  <Route
                    path="dashboard"
                    element={
                      <ProtectedRoute module="dashboard">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="produtos"
                    element={
                      <ProtectedRoute module="products">
                        <AdminProducts />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="produtos/novo"
                    element={
                      <ProtectedRoute module="products">
                        <AdminProductForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="produtos/:id"
                    element={
                      <ProtectedRoute module="products">
                        <AdminProductForm />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="categorias"
                    element={
                      <ProtectedRoute module="categories">
                        <AdminCategories />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="pedidos"
                    element={
                      <ProtectedRoute module="orders">
                        <AdminOrders />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="pedidos/:id"
                    element={
                      <ProtectedRoute module="orders">
                        <AdminOrderDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="clientes"
                    element={
                      <ProtectedRoute module="customers">
                        <AdminCustomers />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="clientes/:id"
                    element={
                      <ProtectedRoute module="customers">
                        <AdminCustomerDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="estoque"
                    element={
                      <ProtectedRoute module="inventory">
                        <AdminInventory />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="financeiro"
                    element={
                      <ProtectedRoute module="finance">
                        <AdminFinance />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="cupons"
                    element={
                      <ProtectedRoute module="coupons">
                        <AdminCoupons />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="avaliacoes"
                    element={
                      <ProtectedRoute module="reviews">
                        <AdminReviews />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="relatorios"
                    element={
                      <ProtectedRoute module="reports">
                        <AdminReports />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="configuracoes"
                    element={
                      <ProtectedRoute module="settings">
                        <AdminSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="usuarios"
                    element={
                      <ProtectedRoute module="users">
                        <AdminUsers />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route
                  path="/*"
                  element={
                    <AppProvider>
                      <CatalogHydrator>
                        <StoreRoutes />
                      </CatalogHydrator>
                    </AppProvider>
                  }
                />
              </Routes>
            </Suspense>
          </AdminToastProvider>
        </AdminAuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}
