import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../hooks/useCart'

export default function Product() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    supabase.from('products').select('*').eq('id', id).single()
      .then(({ data, error }) => {
        if (error) throw error
        setProduct(data)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="container" style={{ padding: 24 }}>Chargement...</div>
  if (!product) return (
    <div className="container" style={{ padding: 24 }}>
      <p>Produit introuvable.</p>
      <Link to="/boutique" className="btn btn-primary">Retour à la boutique</Link>
    </div>
  )

  const hasPromo = product.promo_price != null && product.promo_price < product.price

  return (
    <div className="container product-page">
      <div className="product-detail">
        <div className="product-detail-img">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} loading="lazy" />
          ) : (
            <div className="placeholder">🥩</div>
          )}
        </div>

        <div className="product-detail-info">
          <h1>{product.name}</h1>
          <p className="text-muted">{product.category}</p>
          <p>{product.description}</p>

          <div className="price-row">
            {hasPromo ? (
              <>
                <span className="price-old">{product.price.toFixed(2)} €</span>
                <span className="price-new">{product.promo_price.toFixed(2)} €</span>
              </>
            ) : (
              <span className="price-new">{product.price.toFixed(2)} €</span>
            )}
          </div>

          <div className="qty-row">
            <button className="btn btn-outline btn-sm" onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
            <span>{qty}</span>
            <button className="btn btn-outline btn-sm" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>

          <button
            className="btn btn-primary btn-block"
            disabled={!product.is_available}
            onClick={() => addItem(product, qty)}
          >
            {product.is_available ? 'Ajouter au panier' : 'Indisponible'}
          </button>
        </div>
      </div>

      <style>{`
        .product-page { padding: 24px 16px 40px; }
        .product-detail {
          display: grid;
          gap: 24px;
          grid-template-columns: 1fr;
        }
        .product-detail-img {
          aspect-ratio: 1;
          border-radius: var(--radius);
          overflow: hidden;
          background: var(--color-surface);
        }
        .product-detail-img img { width: 100%; height: 100%; object-fit: cover; }
        .placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 60px; }
        .product-detail-info h1 { margin: 0 0 4px; }
        .price-row { margin: 16px 0; display: flex; gap: 10px; align-items: baseline; }
        .price-old { text-decoration: line-through; color: var(--color-text-muted); }
        .price-new { font-size: 24px; font-weight: 800; color: var(--color-primary); }
        .qty-row { display: flex; align-items: center; gap: 16px; margin-bottom: 16px; font-weight: 700; }
        @media (min-width: 768px) {
          .product-detail { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  )
}
