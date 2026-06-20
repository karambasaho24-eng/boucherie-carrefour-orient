export default function Footer({ config }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div className="container footer-grid">
          <div className="footer-brand">
            <img
              src="/logo.png"
              alt="Logo Boucherie Le Carrefour d'Orient"
              className="footer-logo"
            />
            <h3>{config?.site_title || "Carrefour d'Orient"}</h3>
            <p>Boucherie halal & épicerie orientale au cœur des Sablons, Le Mans</p>
            <div className="footer-certif">
              <span>☪️ Halal certifié</span>
              <span>✓ Vente directe</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>Informations</h4>
            <ul>
              <li>📍 {config?.address || '55 Place des Sablons, 72100 Le Mans'}</li>
              <li>📞 <a href={`tel:${(config?.phone || '0243410951').replace(/\s/g,'')}`}>{config?.phone || '02 43 41 09 51'}</a></li>
              <li>🕒 {config?.opening_hours || 'Lun–Sam 09:30–19:30'}</li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Navigation</h4>
            <ul>
              <li><a href="/">Accueil</a></li>
              <li><a href="/boutique">Boutique</a></li>
              <li><a href="/panier">Panier</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <span>© {new Date().getFullYear()} {config?.site_title || "Boucherie Carrefour d'Orient"} — Tous droits réservés</span>
          <span className="footer-made">
            Le Mans · France 🇫🇷 <a href="/admin/login" className="footer-admin-link">· Espace pro</a>
          </span>
        </div>
      </div>

      <style>{`
        .footer { background: var(--color-charcoal, #1e1e1e); color: rgba(255,255,255,0.85); }
        .footer-top { padding: 56px 0 40px; }
        .footer-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
        }
        .footer-brand {}
        .footer-logo {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: contain;
          background: #fff;
          padding: 3px;
          border: 2px solid rgba(170, 176, 182,0.5);
          margin-bottom: 14px;
        }
        .footer-brand h3 {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px;
          color: #fff;
        }
        .footer-brand p { font-size: 13px; margin: 0 0 14px; opacity: 0.7; line-height: 1.6; }
        .footer-certif { display: flex; gap: 12px; flex-wrap: wrap; }
        .footer-certif span {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 999px;
          border: 1px solid rgba(170, 176, 182,0.4);
          color: rgba(170, 176, 182,0.9);
        }
        .footer-col h4 {
          font-family: var(--font-heading);
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: var(--color-accent);
          margin: 0 0 16px;
        }
        .footer-col ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .footer-col li { font-size: 13px; opacity: 0.75; line-height: 1.5; }
        .footer-col a { opacity: 1; transition: color 0.2s; }
        .footer-col a:hover { color: var(--color-accent); opacity: 1; }
        .footer-bottom {
          border-top: 1px solid rgba(255,255,255,0.08);
          padding: 16px 0;
          background: rgba(0,0,0,0.2);
        }
        .footer-bottom-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
          font-size: 12px;
          opacity: 0.55;
        }
        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 2fr 1fr 1fr; }
        }
        .footer-admin-link {
          opacity: 0.6;
          font-size: 11px;
          transition: opacity 0.2s;
        }
        .footer-admin-link:hover {
          opacity: 1;
          color: var(--color-accent);
        }
      `}</style>
    </footer>
  )
}
