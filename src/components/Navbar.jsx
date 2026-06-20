import { Link, NavLink } from 'react-router-dom'
import { useCart } from '../hooks/useCart'
import DarkModeToggle from './DarkModeToggle'

export default function Navbar({ siteTitle }) {
  const { count } = useCart()

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          <img
            src="/logo.png"
            alt="Logo Boucherie Le Carrefour d'Orient"
            className="navbar-logo-img"
          />
          <div className="navbar-logo-text">
            <span className="navbar-logo-name">{siteTitle || "Carrefour d'Orient"}</span>
            <span className="navbar-logo-sub">Boucherie · Halal</span>
          </div>
        </Link>

        <nav className="navbar-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Accueil</NavLink>
          <NavLink to="/boutique" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>Boutique</NavLink>
        </nav>

        <div className="navbar-actions">
          <DarkModeToggle />
          <Link to="/panier" className="cart-btn" aria-label="Panier">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
        </div>
      </div>

      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: var(--color-surface);
          border-bottom: 1px solid var(--color-border);
          height: var(--header-height);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
          backdrop-filter: blur(8px);
        }
        .navbar-inner {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
          text-decoration: none;
        }
        .navbar-logo-img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: contain;
          background: #fff;
          padding: 2px;
          border: 2px solid var(--color-accent);
          flex-shrink: 0;
        }
        .navbar-logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1.2;
        }
        .navbar-logo-name {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
          color: var(--color-primary);
          white-space: nowrap;
        }
        .navbar-logo-sub {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--color-accent-dark);
        }
        .navbar-links {
          display: none;
          gap: 6px;
        }
        .nav-link {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          color: var(--color-text-muted);
          transition: all 0.2s;
          letter-spacing: 0.2px;
        }
        .nav-link:hover { color: var(--color-primary); background: var(--color-cream); }
        .nav-link.active { color: var(--color-primary); background: rgba(74, 79, 84, 0.08); }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .cart-btn {
          position: relative;
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: var(--color-cream);
          color: var(--color-text);
          border: 1px solid var(--color-border);
          transition: all 0.2s;
        }
        .cart-btn:hover {
          background: var(--color-primary);
          color: #fff;
          border-color: var(--color-primary);
          transform: translateY(-1px);
        }
        .cart-count {
          position: absolute;
          top: -5px;
          right: -5px;
          background: var(--color-red);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          border-radius: 999px;
          padding: 2px 5px;
          min-width: 18px;
          text-align: center;
          line-height: 1.3;
        }
        @media (min-width: 768px) {
          .navbar-links { display: flex; }
        }
      `}</style>
    </header>
  )
}
