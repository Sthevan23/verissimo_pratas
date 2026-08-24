import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { CartDrawer } from './CartDrawer'
import { SearchOverlay } from './SearchOverlay'
import { ToastContainer } from './ui/Toast'

export function Layout() {
  return (
    <>
      <Header />
      <main>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <SearchOverlay />
      <ToastContainer />
    </>
  )
}
