import { useEffect, useMemo, useState } from 'react'
import { fetchAvailableProducts } from '../lib/api'
import ProductCard from '../components/ProductCard'
import CategoryFilter from '../components/CategoryFilter'
import SearchBar from '../components/SearchBar'

export default function Shop() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAvailableProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))],
    [products]
  )

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchCategory = category === 'all' || p.category === category
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase())
      return matchCategory && matchSearch
    })
  }, [products, category, search])

  return (
    <div className="shop-page">
      <div className="shop-hero">
        <div className="shop-hero-overlay" />
        <div className="container shop-hero-content">
          <div className="section-label" style={{ color: 'rgba(170, 176, 182,0.85)' }}>Notre sélection</div>
          <h1>La Boutique</h1>
          <p>Viandes fraîches, produits halal & spécialités orientales</p>
        </div>
      </div>

      <div className="container shop-body">
        <div className="shop-controls">
          <SearchBar value={search} onChange={setSearch} />
          <CategoryFilter categories={categories} active={category} onChange={setCategory} />
        </div>

        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 320, borderRadius: 'var(--radius-lg)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <span>🔍</span>
            <p>Aucun produit trouvé pour cette recherche.</p>
          </div>
        ) : (
          <>
            <div className="shop-results-count">
              {filtered.length} produit{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
            </div>
            <div className="product-grid">
              {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </>
        )}
      </div>

      <style>{`
        .shop-page {}
        .shop-hero {
          position: relative;
          background: linear-gradient(135deg, var(--color-primary-deep, #2e3236) 0%, var(--color-primary) 100%);
          padding: 52px 0 44px;
          color: #fff;
          overflow: hidden;
        }
        .shop-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M30 0L60 30 30 60 0 30z'/%3E%3C/g%3E%3C/svg%3E");
          background-size: 60px 60px;
        }
        .shop-hero-overlay { position: absolute; inset: 0; background: rgba(0,0,0,0.15); }
        .shop-hero-content { position: relative; z-index: 1; }
        .shop-hero-content h1 {
          font-family: var(--font-display);
          font-size: clamp(28px, 5vw, 44px);
          font-weight: 900;
          margin: 4px 0 8px;
        }
        .shop-hero-content p { font-size: 15px; opacity: 0.8; margin: 0; }
        .shop-body { padding: 32px 0 60px; }
        .shop-controls { margin-bottom: 8px; }
        .shop-results-count {
          font-size: 13px;
          color: var(--color-text-muted);
          margin-bottom: 16px;
          font-weight: 500;
        }
        .product-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--color-text-muted);
        }
        .empty-state span { font-size: 48px; display: block; margin-bottom: 12px; }
        .empty-state p { font-size: 16px; margin: 0; }
        @media (min-width: 640px) {
          .product-grid { grid-template-columns: repeat(3, 1fr); gap: 20px; }
        }
        @media (min-width: 1024px) {
          .product-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>
    </div>
  )
}
