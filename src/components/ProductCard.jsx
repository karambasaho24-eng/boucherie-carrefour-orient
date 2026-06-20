import { useCart } from '../hooks/useCart'

export default function ProductCard({ product }) {
  const { addItem } = useCart()
  const hasPromo = product.promo_price != null && product.promo_price < product.price
  const discount = hasPromo ? Math.round((1 - product.promo_price / product.price) * 100) : 0

  return (
    <div className="product-card">
      <div className="product-img-wrap">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} loading="lazy" />
        ) : (
          <div className="product-img-placeholder">
            <span>🥩</span>
          </div>
        )}
        <div className="product-img-overlay" />
        {hasPromo && (
          <span className="badge-promo-pill">-{discount}%</span>
        )}
        {product.category && (
          <span className="product-category-pill">{product.category}</span>
        )}
      </div>

      <div className="product-body">
        <div className="product-halal-dot">
          <span className="halal-icon">☪</span>
          <span>Halal</span>
        </div>
        <h3 className="product-name">{product.name}</h3>
        {product.description && (
          <p className="product-desc">{product.description}</p>
        )}

        <div className="product-footer">
          <div className="price-block">
            {hasPromo ? (
              <>
                <span className="price-old">{product.price.toFixed(2)} €</span>
                <span className="price-new">{product.promo_price.toFixed(2)} €</span>
              </>
            ) : (
              <span className="price-new">{product.price.toFixed(2)} €</span>
            )}
            <span className="price-unit">/ kg</span>
          </div>
          <button
            className="add-to-cart-btn"
            onClick={() => addItem(product)}
            disabled={!product.is_available}
            aria-label={`Ajouter ${product.name} au panier`}
          >
            {product.is_available ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Ajouter
              </>
            ) : 'Indispo'}
          </button>
        </div>
      </div>

      <style>{`
        .product-card {
          display: flex;
          flex-direction: column;
          border-radius: var(--radius-lg);
          overflow: hidden;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          box-shadow: var(--shadow);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          height: 100%;
        }
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-xl);
        }
        .product-img-wrap {
          position: relative;
          aspect-ratio: 4 / 3;
          background: linear-gradient(135deg, var(--color-cream), var(--color-border));
          overflow: hidden;
        }
        .product-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .product-card:hover .product-img-wrap img {
          transform: scale(1.06);
        }
        .product-img-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.25) 0%, transparent 50%);
          pointer-events: none;
        }
        .product-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .product-img-placeholder span { font-size: 48px; opacity: 0.4; }
        .badge-promo-pill {
          position: absolute;
          top: 10px;
          left: 10px;
          background: var(--color-red);
          color: #fff;
          font-size: 11px;
          font-weight: 800;
          padding: 4px 10px;
          border-radius: 999px;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(192,57,43,0.4);
        }
        .product-category-pill {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(74, 79, 84,0.85);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 999px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          backdrop-filter: blur(4px);
        }
        .product-body {
          padding: 14px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          flex: 1;
        }
        .product-halal-dot {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 10px;
          font-weight: 700;
          color: var(--color-primary);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .halal-icon { font-size: 12px; }
        .product-name {
          margin: 2px 0 0;
          font-family: var(--font-heading);
          font-size: 15px;
          font-weight: 600;
          letter-spacing: 0.3px;
          color: var(--color-text);
          line-height: 1.3;
        }
        .product-desc {
          font-size: 12px;
          margin: 0;
          color: var(--color-text-muted);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.5;
        }
        .product-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          padding-top: 12px;
          border-top: 1px solid var(--color-border);
        }
        .price-block {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
          gap: 1px;
        }
        .price-old {
          font-size: 11px;
          text-decoration: line-through;
          color: var(--color-text-muted);
        }
        .price-new {
          font-size: 18px;
          font-weight: 800;
          color: var(--color-primary);
          font-family: var(--font-heading);
        }
        .price-unit {
          font-size: 10px;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        .add-to-cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 9px 14px;
          background: var(--color-primary);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          font-family: var(--font-body);
          letter-spacing: 0.3px;
          transition: all 0.2s ease;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(74, 79, 84,0.3);
        }
        .add-to-cart-btn:hover:not(:disabled) {
          background: var(--color-primary-light);
          transform: scale(1.04);
          box-shadow: 0 4px 14px rgba(74, 79, 84,0.4);
        }
        .add-to-cart-btn:disabled {
          background: var(--color-border);
          color: var(--color-text-muted);
          box-shadow: none;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}
