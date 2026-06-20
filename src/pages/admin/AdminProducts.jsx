import { useEffect, useRef, useState } from 'react'
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
} from '../../lib/api'

const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  promo_price: '',
  category: '',
  image_url: '',
  is_available: true,
}

export default function AdminProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const fileRef = useRef()

  async function load() {
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function openNew() {
    setEditId(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  function openEdit(p) {
    setEditId(p.id)
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      promo_price: p.promo_price != null ? String(p.promo_price) : '',
      category: p.category || '',
      image_url: p.image_url || '',
      is_available: p.is_available,
    })
    setError('')
    setShowForm(true)
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadProductImage(file)
      setForm((f) => ({ ...f, image_url: url }))
    } catch (err) {
      setError("Erreur upload image.")
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    if (!form.name.trim() || !form.price) { setError('Nom et prix obligatoires.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price),
        promo_price: form.promo_price !== '' ? parseFloat(form.promo_price) : null,
        category: form.category.trim(),
        image_url: form.image_url,
        is_available: form.is_available,
      }
      if (editId) {
        await updateProduct(editId, payload)
      } else {
        await createProduct(payload)
      }
      await load()
      setShowForm(false)
    } catch (err) {
      setError("Erreur lors de la sauvegarde.")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce produit ?')) return
    try {
      await deleteProduct(id)
      setProducts((p) => p.filter((x) => x.id !== id))
    } catch {
      alert('Erreur lors de la suppression.')
    }
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Produits</h2>
        <button className="btn btn-primary btn-sm" onClick={openNew}>+ Nouveau produit</button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal card" onClick={e => e.stopPropagation()}>
            <h3>{editId ? 'Modifier' : 'Nouveau produit'}</h3>

            <div className="field">
              <label>Nom *</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label>Description</label>
              <textarea className="textarea" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="form-row">
              <div className="field">
                <label>Prix (€) *</label>
                <input className="input" type="number" min="0" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="field">
                <label>Prix promo (€)</label>
                <input className="input" type="number" min="0" step="0.01" value={form.promo_price} onChange={e => setForm(f => ({ ...f, promo_price: e.target.value }))} />
              </div>
            </div>
            <div className="field">
              <label>Catégorie</label>
              <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Bœuf, Agneau, Épicerie..." />
            </div>

            <div className="field">
              <label>Image</label>
              {form.image_url && (
                <img src={form.image_url} alt="preview" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 6 }} />
              )}
              <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleImageUpload} />
              <button className="btn btn-outline btn-sm" onClick={() => fileRef.current.click()} disabled={uploading}>
                {uploading ? '⏳ Upload...' : '📷 Prendre une photo / Choisir une image'}
              </button>
            </div>

            <div className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <input type="checkbox" id="available" checked={form.is_available} onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />
              <label htmlFor="available" style={{ marginBottom: 0 }}>Disponible</label>
            </div>

            {error && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>}

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={() => setShowForm(false)}>Annuler</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-muted">Chargement...</p>
      ) : (
        <div className="product-table">
          <div className="product-table-header">
            <span>Produit</span>
            <span>Prix</span>
            <span>Catégorie</span>
            <span>Dispo</span>
            <span>Actions</span>
          </div>
          {products.map((p) => (
            <div key={p.id} className="product-row">
              <div className="product-row-name">
                {p.image_url && <img src={p.image_url} alt={p.name} />}
                <span>{p.name}</span>
              </div>
              <span>
                {p.promo_price != null ? (
                  <><s style={{ opacity: 0.5, fontSize: 12 }}>{p.price.toFixed(2)}€</s> <strong style={{ color: 'var(--color-danger)' }}>{p.promo_price.toFixed(2)}€</strong></>
                ) : (
                  `${p.price.toFixed(2)} €`
                )}
              </span>
              <span className="text-muted">{p.category || '—'}</span>
              <span>{p.is_available ? '✅' : '❌'}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(p)}>✏️</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-muted" style={{ padding: 16 }}>Aucun produit.</p>}
        </div>
      )}

      <style>{`
        .admin-section { padding: 0 0 40px; }
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-header h2 { margin: 0; }
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 100;
          display: flex; align-items: flex-start; justify-content: center; padding: 24px;
          overflow-y: auto;
        }
        .modal { width: 100%; max-width: 520px; padding: 24px; }
        .modal h3 { margin: 0 0 16px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .modal-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 16px; }
        .product-table { border: 1px solid var(--color-border); border-radius: var(--radius); overflow: hidden; }
        .product-table-header, .product-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 60px 90px;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          font-size: 13px;
        }
        .product-table-header {
          background: var(--color-bg);
          font-weight: 700;
          color: var(--color-text-muted);
          font-size: 12px;
          text-transform: uppercase;
        }
        .product-row { border-top: 1px solid var(--color-border); }
        .product-row-name { display: flex; align-items: center; gap: 8px; font-weight: 600; }
        .product-row-name img { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; }
      `}</style>
    </div>
  )
}
