import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './hooks/useCart'
import { AuthProvider } from './hooks/useAuth'
import { fetchSiteConfig } from './lib/api'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import ProtectedRoute from './components/ProtectedRoute'
import CartToast from './components/CartToast'

import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Cart from './pages/Cart'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    fetchSiteConfig().then(setConfig).catch(console.error)
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Admin - layout séparé, pas de Navbar publique */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Site public */}
            <Route
              path="*"
              element={
                <>
                  <Navbar siteTitle={config?.site_title} />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Home config={config} />} />
                      <Route path="/boutique" element={<Shop />} />
                      <Route path="/produit/:id" element={<Product />} />
                      <Route path="/panier" element={<Cart config={config} />} />
                    </Routes>
                  </main>
                  <Footer config={config} />
                  <WhatsAppButton phone={config?.phone} />
                  <CartToast />
                </>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
