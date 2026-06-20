import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fetchAvailableProducts } from '../lib/api'
import ProductCard from '../components/ProductCard'

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal')
    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) } }),
      { threshold: 0.12 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

export default function Home({ config }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  useReveal()

  useEffect(() => {
    fetchAvailableProducts()
      .then((data) => setProducts(data.slice(0, 6)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="home-page">

      {/* ── HERO ── */}
      <section
        className="hero"
        style={config?.banner_image ? { backgroundImage: `url(${config.banner_image})` } : undefined}
      >
        {/* Moroccan damask pattern overlay */}
        <div className="hero-pattern" />
        <div className="hero-overlay" />

        <div className="container hero-content">
          {/* Store sign replica */}
          <div className="hero-storefront">
            <div className="storefront-sign">
              <span className="sign-text">BOUCHERIE</span>
              <span className="sign-separator">·</span>
              <span className="sign-text">RÔTISSERIE</span>
            </div>
          </div>

          <div className="hero-logo-wrap">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTM3OdNVf3pJQdgARQ0Ib7hxutDqfMdhIDNTw&s"
              alt="Logo Carrefour d'Orient"
              className="hero-logo"
            />
          </div>

          <h1 className="hero-title">
            {config?.hero_title || "Carrefour d'Orient"}
          </h1>
          <p className="hero-subtitle">
            {config?.hero_subtitle || 'Boucherie halal, charcuterie & rôtisserie artisanales · Le Mans'}
          </p>

          <div className="hero-badges">
            <span className="hero-badge">✓ Halal certifié</span>
            <span className="hero-badge">✓ Viande fraîche</span>
            <span className="hero-badge">✓ Vente directe</span>
          </div>

          <div className="hero-actions">
            <Link to="/boutique" className="btn btn-accent hero-btn-main">
              Découvrir la boutique
            </Link>
            <a
              href={`tel:${(config?.phone || '0243410951').replace(/\s/g, '')}`}
              className="btn btn-outline"
            >
              📞 {config?.phone || '02 43 41 09 51'}
            </a>
          </div>
        </div>

        <div className="hero-scroll-hint">
          <span>↓</span>
        </div>
      </section>

      {/* ── INFO STRIP ── */}
      <section className="info-strip">
        <div className="container info-strip-inner">
          <div className="info-item reveal">
            <div className="info-icon">📍</div>
            <div>
              <div className="info-label">Adresse</div>
              <div className="info-value">{config?.address || '55 Place des Sablons, 72100 Le Mans'}</div>
            </div>
          </div>
          <div className="info-divider" />
          <div className="info-item reveal reveal-delay-1">
            <div className="info-icon">🕒</div>
            <div>
              <div className="info-label">Horaires</div>
              <div className="info-value">{config?.opening_hours || 'Lun–Sam 09:30 – 19:30'}</div>
            </div>
          </div>
          <div className="info-divider" />
          <div className="info-item reveal reveal-delay-2">
            <div className="info-icon">☪️</div>
            <div>
              <div className="info-label">Certification</div>
              <div className="info-value">100 % Halal & vente directe</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── QUALITY PILLARS ── */}
      <section className="pillars-section">
        <div className="container">
          <div className="reveal text-center">
            <div className="section-label">Notre engagement</div>
            <h2 className="section-title">La qualité à chaque étape</h2>
          </div>
          <div className="pillars-grid">
            {[
              { icon: '🐄', title: 'Viandes sélectionnées', desc: 'Bœuf, agneau et volaille choisis avec soin auprès de fournisseurs de confiance.' },
              { icon: '🔪', title: 'Découpe artisanale', desc: 'Chaque pièce est préparée sur place par nos bouchers expérimentés.' },
              { icon: '🔥', title: 'Rôtisserie fraîche', desc: 'Poulets, merguez et spécialités grillées chaque jour pour emporter.' },
              { icon: '🌿', title: 'Halal certifié', desc: 'Toutes nos viandes sont halal, rigoureusement sélectionnées et tracées.' },
            ].map((p, i) => (
              <div key={i} className={`pillar-card reveal reveal-delay-${i}`}>
                <div className="pillar-icon">{p.icon}</div>
                <h3 className="pillar-title">{p.title}</h3>
                <p className="pillar-desc">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ── */}
      <section className="products-section">
        <div className="container">
          <div className="products-header reveal">
            <div>
              <div className="section-label">Notre sélection</div>
              <h2 className="section-title">Produits du moment</h2>
            </div>
            <Link to="/boutique" className="btn btn-ghost see-all-btn">
              Voir tout →
            </Link>
          </div>

          {loading ? (
            <div className="product-grid">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ height: 320 }} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <p className="text-muted mt-16">Aucun produit pour le moment.</p>
          ) : (
            <div className="product-grid">
              {products.map((p, i) => (
                <div key={p.id} className={`reveal reveal-delay-${Math.min(i, 3)}`}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}

          <div className="text-center reveal" style={{ marginTop: 40 }}>
            <Link to="/boutique" className="btn btn-primary" style={{ padding: '15px 40px', fontSize: 16 }}>
              Voir toute la boutique
            </Link>
          </div>
        </div>
      </section>

      {/* ── AMBIANCE STRIP ── */}
      <section className="ambiance-section">
        <div className="ambiance-overlay" />
        <div className="container ambiance-content">
          <div className="reveal">
            <div className="section-label" style={{ color: 'rgba(170, 176, 182,0.9)' }}>Depuis des années</div>
            <h2 className="ambiance-title">La boucherie de votre quartier</h2>
            <p className="ambiance-text">
              Installée au cœur des Sablons au Mans, la Boucherie Carrefour d'Orient vous accueille chaque jour 
              avec des produits frais, une découpe soignée et le sourire. Notre passion : vous offrir la meilleure 
              viande halal au meilleur prix.
            </p>
            <a
              href={`tel:${(config?.phone || '0243410951').replace(/\s/g, '')}`}
              className="btn btn-accent"
              style={{ marginTop: 24 }}
            >
              📞 Nous appeler
            </a>
          </div>
        </div>
      </section>

      {/* ── SPECIALTIES ── */}
      <section className="specialties-section">
        <div className="container">
          <div className="reveal text-center">
            <div className="section-label">Nos spécialités</div>
            <h2 className="section-title">Épicerie & Rôtisserie orientale</h2>
          </div>
          <div className="specialties-grid">
            {[
              { label: 'Bœuf', emoji: '🐄', desc: 'Côtes, steaks, mincés...' },
              { label: 'Agneau', emoji: '🐑', desc: 'Gigot, côtelettes, épaule...' },
              { label: 'Volaille', emoji: '🐓', desc: 'Poulet entier, cuisses, ailes...' },
              { label: 'Merguez', emoji: '🌶️', desc: 'Fraîches, maison, épicées...' },
              { label: 'Épicerie', emoji: '🫙', desc: 'Produits orientaux sélectionnés' },
              { label: 'Rôtisserie', emoji: '🔥', desc: 'Poulets rôtis, brochettes...' },
            ].map((s, i) => (
              <div key={i} className={`specialty-item reveal reveal-delay-${i % 3}`}>
                <span className="specialty-emoji">{s.emoji}</span>
                <span className="specialty-label">{s.label}</span>
                <span className="specialty-desc">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        .home-page { overflow-x: hidden; }

        /* ── HERO ── */
        .hero {
          position: relative;
          background: #1e2820;
          background-size: cover;
          background-position: center;
          min-height: 92vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .hero-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.06;
          background-image: 
            radial-gradient(circle at 25% 25%, rgba(170, 176, 182,0.3) 0%, transparent 50%),
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z M30 10 L50 30 L30 50 L10 30 Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          background-size: 60px 60px;
        }
        .hero-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(8, 22, 14, 0.82) 0%,
            rgba(74, 79, 84, 0.6) 50%,
            rgba(8, 22, 14, 0.85) 100%
          );
        }
        .hero-content {
          position: relative;
          z-index: 2;
          text-align: center;
          color: #fff;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0;
        }

        /* Storefront sign */
        .hero-storefront {
          margin-bottom: 28px;
        }
        .storefront-sign {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          background: #2a3530;
          border: 1px solid rgba(170, 176, 182, 0.3);
          border-radius: 6px;
          padding: 10px 28px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05);
        }
        .sign-text {
          font-family: var(--font-heading);
          font-size: clamp(18px, 4vw, 30px);
          font-weight: 700;
          color: #fff;
          letter-spacing: 4px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.6);
        }
        .sign-separator {
          color: var(--color-accent);
          font-size: 24px;
        }

        .hero-logo-wrap {
          margin-bottom: 24px;
        }
        .hero-logo {
          width: 130px;
          height: 130px;
          border-radius: 50%;
          border: 3px solid rgba(170, 176, 182,0.6);
          object-fit: cover;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 0 6px rgba(170, 176, 182,0.1);
          background: #fff;
          margin: 0 auto;
        }
        .hero-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 6vw, 52px);
          font-weight: 900;
          margin: 0 0 12px;
          line-height: 1.1;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
        }
        .hero-subtitle {
          font-size: clamp(14px, 2.5vw, 18px);
          opacity: 0.85;
          max-width: 520px;
          margin: 0 auto 20px;
          line-height: 1.6;
        }
        .hero-badges {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 28px;
        }
        .hero-badge {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(170, 176, 182,0.4);
          color: rgba(255,255,255,0.9);
          border-radius: 999px;
          padding: 6px 14px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.3px;
          backdrop-filter: blur(4px);
        }
        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        .hero-btn-main {
          font-size: 16px;
          padding: 15px 32px;
          letter-spacing: 0.5px;
        }
        .hero-scroll-hint {
          position: absolute;
          bottom: 28px;
          left: 50%;
          transform: translateX(-50%);
          color: rgba(255,255,255,0.5);
          font-size: 20px;
          animation: bounce 2s infinite;
          z-index: 2;
        }
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(8px); }
        }

        /* ── INFO STRIP ── */
        .info-strip {
          background: var(--color-primary);
          color: #fff;
          padding: 0;
        }
        .info-strip-inner {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        .info-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 22px 20px;
        }
        .info-icon { font-size: 22px; flex-shrink: 0; }
        .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; margin-bottom: 2px; }
        .info-value { font-size: 14px; font-weight: 600; }
        .info-divider { display: none; width: 1px; background: rgba(255,255,255,0.2); margin: 16px 0; }

        /* ── PILLARS ── */
        .pillars-section {
          padding: 72px 0;
          background: var(--color-bg);
        }
        .section-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 700;
          margin: 0 0 40px;
          color: var(--color-text);
          line-height: 1.2;
        }
        .pillars-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .pillar-card {
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 28px 24px;
          text-align: center;
          box-shadow: var(--shadow);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .pillar-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
        }
        .pillar-icon { font-size: 36px; margin-bottom: 14px; }
        .pillar-title {
          font-family: var(--font-heading);
          font-size: 17px;
          font-weight: 600;
          letter-spacing: 0.5px;
          margin: 0 0 8px;
          color: var(--color-primary);
        }
        .pillar-desc { font-size: 14px; color: var(--color-text-muted); margin: 0; line-height: 1.6; }

        /* ── PRODUCTS ── */
        .products-section {
          padding: 72px 0;
          background: var(--color-cream);
        }
        .products-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 32px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .products-header .section-title { margin-bottom: 0; }
        .see-all-btn { font-size: 14px; padding: 10px 18px; }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        /* ── AMBIANCE ── */
        .ambiance-section {
          position: relative;
          background: linear-gradient(135deg, #4a4f54 0%, #2e3236 60%, #1a1a1a 100%);
          padding: 80px 0;
          overflow: hidden;
        }
        .ambiance-section::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M40 0 L80 40 L40 80 L0 40 Z'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 80px 80px;
        }
        .ambiance-overlay { position: absolute; inset: 0; }
        .ambiance-content { position: relative; z-index: 1; color: #fff; max-width: 680px; }
        .ambiance-title {
          font-family: var(--font-display);
          font-size: clamp(26px, 5vw, 42px);
          font-weight: 900;
          margin: 0 0 16px;
          line-height: 1.15;
        }
        .ambiance-text { font-size: 16px; opacity: 0.85; line-height: 1.7; margin: 0; }

        /* ── SPECIALTIES ── */
        .specialties-section { padding: 72px 0; background: var(--color-bg); }
        .specialties-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          margin-top: 32px;
        }
        .specialty-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 6px;
          padding: 24px 16px;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius);
          box-shadow: var(--shadow);
          transition: transform 0.25s, box-shadow 0.25s;
          cursor: default;
        }
        .specialty-item:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-accent);
        }
        .specialty-emoji { font-size: 30px; }
        .specialty-label { font-family: var(--font-heading); font-size: 15px; font-weight: 600; letter-spacing: 0.5px; color: var(--color-primary); }
        .specialty-desc { font-size: 12px; color: var(--color-text-muted); }

        /* ── RESPONSIVE ── */
        @media (min-width: 640px) {
          .hero-actions { flex-direction: row; }
          .info-strip-inner { grid-template-columns: repeat(3, 1fr); }
          .info-divider { display: block; }
          .info-item { justify-content: center; text-align: center; flex-direction: column; gap: 8px; }
          .info-icon { font-size: 28px; }
          .pillars-grid { grid-template-columns: repeat(2, 1fr); }
          .specialties-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (min-width: 768px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
          .hero-logo { width: 160px; height: 160px; }
        }
        @media (min-width: 1024px) {
          .pillars-grid { grid-template-columns: repeat(4, 1fr); }
          .product-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  )
}
