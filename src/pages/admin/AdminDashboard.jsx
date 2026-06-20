import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signOut } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import AdminProducts from './AdminProducts'
import AdminOrders from './AdminOrders'
import AdminConfig from './AdminConfig'

const TABS = [
  { id: 'orders', label: '📦 Commandes' },
  { id: 'products', label: '🥩 Produits' },
  { id: 'config', label: '⚙️ Paramètres' },
]

export default function AdminDashboard() {
  const [tab, setTab] = useState('orders')
  const { profile, refreshProfile } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    await refreshProfile()
    navigate('/admin/login')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>🥩</span>
          <div>
            <p className="admin-brand-title">Carrefour d'Orient</p>
            <p className="admin-brand-sub">Administration</p>
          </div>
        </div>

        <nav className="admin-nav">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`admin-nav-item ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="admin-footer">
          <p className="text-muted">{profile?.email}</p>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Déconnexion</button>
        </div>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-tabs">
            {TABS.map((t) => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? 'active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleLogout}>Déco</button>
        </div>

        <div className="admin-content">
          {tab === 'orders' && <AdminOrders />}
          {tab === 'products' && <AdminProducts />}
          {tab === 'config' && <AdminConfig />}
        </div>
      </main>

      <style>{`
        .admin-layout {
          min-height: 100vh;
          display: flex;
          background: var(--color-bg);
        }
        .admin-sidebar {
          display: none;
          width: 240px;
          flex-shrink: 0;
          background: var(--color-surface);
          border-right: 1px solid var(--color-border);
          flex-direction: column;
          padding: 20px 0;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
        }
        .admin-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 20px 20px;
          border-bottom: 1px solid var(--color-border);
          font-size: 22px;
        }
        .admin-brand-title { font-weight: 700; font-size: 14px; margin: 0; }
        .admin-brand-sub { font-size: 11px; color: var(--color-text-muted); margin: 0; }
        .admin-nav { padding: 12px 0; flex: 1; }
        .admin-nav-item {
          width: 100%;
          padding: 12px 20px;
          text-align: left;
          background: none;
          border: none;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-muted);
          display: block;
        }
        .admin-nav-item.active {
          color: var(--color-primary);
          background: rgba(74, 79, 84, 0.07);
          border-right: 3px solid var(--color-primary);
        }
        .admin-footer { padding: 16px 20px; border-top: 1px solid var(--color-border); }
        .admin-footer p { font-size: 12px; margin: 0 0 8px; }

        .admin-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .admin-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          padding: 0 16px;
          gap: 8px;
          overflow-x: auto;
        }
        .admin-tabs { display: flex; gap: 0; }
        .tab-btn {
          padding: 16px 14px;
          font-size: 13px;
          font-weight: 600;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--color-text-muted);
          white-space: nowrap;
        }
        .tab-btn.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
        }
        .admin-content { padding: 24px 16px; flex: 1; }

        @media (min-width: 768px) {
          .admin-sidebar { display: flex; }
          .admin-topbar { display: none; }
          .admin-content { padding: 32px 28px; }
        }
      `}</style>
    </div>
  )
}
