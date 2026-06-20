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
          <div className="product-img-placeholder" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <path d="M4 4h16v16H4z" />
              <path d="M4 14l5-5 4 4 7-7" />
            </svg>
          </div>
        )}
        {hasPromo && (
          <span className="badge-promo-pill">-{discount}%</span>
        )}
        {product.category && (
          <span className="product-category-pill">{product.category}</span>
        )}
      </div>

      <div className="product-body">
        <div className="product-halal-dot">Halal</div>
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
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
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
          border-radius: 0;
          overflow: hidden;
          background: var(--color-surface);
          height: 100%;
          transition: box-shadow 0.4s cubic-bezier(0.16,1,0.3,1);
        }
        .product-card:hover { box-shadow: var(--shadow-lg); }
        .product-img-wrap {
          position: relative;
          aspect-ratio: 4 / 3;
          background: var(--color-paper-dim);
          overflow: hidden;
        }
        .product-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.7s cubic-bezier(0.16,1,0.3,1);
        }
        .product-card:hover .product-img-wrap img {
          transform: scale(1.05);
        }
        .product-img-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-border-dark);
        }
        .badge-promo-pill {
          position: absolute;
          top: 12px;
          left: 12px;
          background: var(--color-red);
          color: #fff;
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 700;
          padding: 4px 9px;
          letter-spacing: 0.3px;
        }
        .product-category-pill {
          position: absolute;
          bottom: 12px;
          left: 12px;
          background: var(--color-paper);
          color: var(--color-ink);
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          padding: 4px 10px;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .product-body {
          padding: 20px 22px 22px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          flex: 1;
        }
        .product-halal-dot {
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 700;
          color: var(--color-red);
          text-transform: uppercase;
          letter-spacing: 1.5px;
        }
        .product-name {
          margin: 4px 0 0;
          font-family: var(--font-heading);
          font-size: 17px;
          font-weight: 700;
          letter-spacing: -0.2px;
          color: var(--color-text);
          line-height: 1.3;
        }
        .product-desc {
          font-size: 12.5px;
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
          gap: 10px;
          padding-top: 16px;
          border-top: 1px solid var(--color-border);
        }
        .price-block {
          display: flex;
          flex-direction: column;
          line-height: 1.15;
          gap: 1px;
        }
        .price-old {
          font-family: var(--font-mono);
          font-size: 11px;
          text-decoration: line-through;
          color: var(--color-text-muted);
        }
        .price-new {
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 700;
          color: var(--color-text);
        }
        .price-unit {
          font-size: 10px;
          color: var(--color-text-muted);
          font-weight: 500;
        }
        .add-to-cart-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--color-ink);
          color: var(--color-paper);
          border: 1px solid var(--color-ink);
          border-radius: 0;
          font-size: 11px;
          font-weight: 700;
          font-family: var(--font-body);
          letter-spacing: 0.8px;
          text-transform: uppercase;
          transition: all 0.25s ease;
          flex-shrink: 0;
        }
        .add-to-cart-btn:hover:not(:disabled) {
          background: var(--color-paper);
          color: var(--color-ink);
        }
        .add-to-cart-btn:disabled {
          background: var(--color-border);
          color: var(--color-text-muted);
          border-color: var(--color-border);
          cursor: not-allowed;
        }
      `}</style>
    </div>
  )
}

