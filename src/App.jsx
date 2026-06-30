import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './hooks/useCart'
import { AuthProvider } from './hooks/useAuth'
import { fetchSiteConfig } from './lib/api'
import { supabase } from './lib/supabaseClient'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import WhatsAppButton from './components/WhatsAppButton'
import ProtectedRoute from './components/ProtectedRoute'
import CartToast from './components/CartToast'
import OrderReminder from './components/OrderReminder'

import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Cart from './pages/Cart'
import OrderStatus from './pages/OrderStatus'
import AdminLogin from './pages/admin/AdminLogin'
import AdminDashboard from './pages/admin/AdminDashboard'

export default function App() {
  const [config, setConfig] = useState(null)

  useEffect(() => {
    fetchSiteConfig().then(setConfig).catch(console.error)
  }, [])

  // Applique le thème de couleur choisi par l'admin sur tout le site
  // (le mode sombre/clair reste géré séparément par DarkModeToggle).
  // "original" retire l'attribut pour revenir aux valeurs par défaut
  // (noir/blanc/rouge) définies dans :root.
  useEffect(() => {
    if (!config?.theme_color || config.theme_color === 'original') {
      document.documentElement.removeAttribute('data-color-theme')
    } else {
      document.documentElement.setAttribute('data-color-theme', config.theme_color)
    }
  }, [config?.theme_color])

  // Favicon dynamique : si l'admin a uploadé un favicon personnalisé,
  // on remplace l'icône par défaut du site dans l'onglet du navigateur.
  useEffect(() => {
    if (!config?.favicon_url) return
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = config.favicon_url
  }, [config?.favicon_url])

  // Titre de l'onglet navigateur dynamique
  useEffect(() => {
    if (config?.site_title) {
      document.title = config.site_title
    }
  }, [config?.site_title])

  // Supabase Realtime : toute modification faite par l'admin (titre, logo,
  // histoire, horaires, activation Stripe, thème, etc.) se reflète
  // instantanément sur le site public, sans que le visiteur ait besoin
  // de recharger la page.
  useEffect(() => {
    const channel = supabase
      .channel('public-site-config-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'site_config', filter: 'id=eq.1' },
        (payload) => setConfig((prev) => ({ ...prev, ...payload.new }))
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
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
                  <OrderReminder />
                  <Navbar siteTitle={config?.site_title} logoUrl={config?.logo_url} businessType={config?.business_type} />
                  <main className="main-content">
                    <Routes>
                      <Route path="/" element={<Home config={config} />} />
                      <Route path="/boutique" element={<Shop />} />
                      <Route path="/produit/:id" element={<Product />} />
                      <Route path="/panier" element={<Cart config={config} />} />
                      <Route path="/commande/:id" element={<OrderStatus />} />
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
