import { useEffect, useRef, useState } from 'react'
import { fetchSiteConfig, updateSiteConfig, uploadSiteImage } from '../../lib/api'

export default function AdminConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const bannerRef = useRef()

  useEffect(() => {
    fetchSiteConfig()
      .then(setConfig)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setConfig((c) => ({ ...c, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleBannerUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadSiteImage(file)
      setConfig((c) => ({ ...c, banner_image: url }))
    } catch {
      setError('Erreur upload bannière.')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    setSuccess(false)
    try {
      await updateSiteConfig({
        site_title: config.site_title,
        hero_title: config.hero_title,
        hero_subtitle: config.hero_subtitle,
        opening_hours: config.opening_hours,
        phone: config.phone,
        address: config.address,
        banner_image: config.banner_image,
        whatsapp_number: config.whatsapp_number,
        order_mode: config.order_mode,
        delivery_enabled: config.delivery_enabled ?? false,
        stripe_enabled: config.stripe_enabled ?? false,
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-muted">Chargement...</p>

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>Configuration du site</h2>
      </div>

      <div className="config-grid">
        {/* Identité */}
        <div className="config-block">
          <h4>Identité</h4>
          <div className="field">
            <label>Titre du site</label>
            <input className="input" name="site_title" value={config.site_title || ''} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Titre hero (bannière)</label>
            <input className="input" name="hero_title" value={config.hero_title || ''} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Sous-titre hero</label>
            <textarea className="textarea" name="hero_subtitle" rows={2} value={config.hero_subtitle || ''} onChange={handleChange} />
          </div>
        </div>

        {/* Contact */}
        <div className="config-block">
          <h4>Contact & Horaires</h4>
          <div className="field">
            <label>Téléphone</label>
            <input className="input" name="phone" value={config.phone || ''} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Adresse de la boutique</label>
            <input className="input" name="address" value={config.address || ''} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Horaires d'ouverture</label>
            <input className="input" name="opening_hours" value={config.opening_hours || ''} onChange={handleChange} placeholder="09:30 - 19:30" />
          </div>
        </div>

        {/* Bannière */}
        <div className="config-block">
          <h4>Image bannière</h4>
          {config.banner_image && (
            <img src={config.banner_image} alt="Bannière" className="banner-preview" />
          )}
          <input ref={bannerRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleBannerUpload} />
          <button className="btn btn-ghost btn-sm" onClick={() => bannerRef.current.click()} disabled={uploading}>
            {uploading ? 'Upload…' : 'Prendre une photo / Choisir une image'}
          </button>
          {config.banner_image && (
            <button className="btn btn-danger btn-sm banner-delete-btn" onClick={() => setConfig((c) => ({ ...c, banner_image: '' }))}>
              Supprimer
            </button>
          )}
        </div>

        {/* Commande & WhatsApp */}
        <div className="config-block">
          <h4>Commande & WhatsApp</h4>
          <div className="field">
            <label>Numéro WhatsApp</label>
            <input className="input" name="whatsapp_number" value={config.whatsapp_number || ''} onChange={handleChange} placeholder="+33243410951" />
          </div>
          <div className="field">
            <label>Mode de commande</label>
            <select className="select" name="order_mode" value={config.order_mode || 'both'} onChange={handleChange}>
              <option value="site">Site uniquement</option>
              <option value="whatsapp">WhatsApp uniquement</option>
              <option value="both">Site + WhatsApp</option>
            </select>
          </div>
          {config.whatsapp_number && (
            <div className="whatsapp-preview">
              <p className="whatsapp-preview-label">Aperçu du message envoyé</p>
              <pre className="whatsapp-preview-text">{`Commande #ABCD1234\nNom du client\nTél. ${config.whatsapp_number}\n\n- Produit x1 — 10.00 €\n\nTotal : 10.00 €`}</pre>
            </div>
          )}
        </div>

        {/* Livraison */}
        <div className="config-block">
          <h4>Livraison</h4>
          <div className="delivery-toggle-row">
            <div className="delivery-toggle-info">
              <p className="delivery-toggle-title">Activer la livraison à domicile</p>
              <p className="delivery-toggle-desc">
                Lorsqu'activée, le client doit saisir son adresse lors de la commande.
                Lorsque désactivée, seul le retrait en boutique est proposé.
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="delivery_enabled"
                checked={config.delivery_enabled ?? false}
                onChange={handleChange}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className={`delivery-status ${config.delivery_enabled ? 'status-on' : 'status-off'}`}>
            {config.delivery_enabled ? '🚚 Livraison activée' : '🏪 Retrait boutique uniquement'}
          </div>
        </div>

        {/* Paiement Stripe */}
        <div className="config-block">
          <h4>Paiement en ligne</h4>
          <div className="delivery-toggle-row">
            <div className="delivery-toggle-info">
              <p className="delivery-toggle-title">Activer le paiement par carte (Stripe)</p>
              <p className="delivery-toggle-desc">
                Lorsqu'activé, le client peut payer en ligne une commande confirmée, ou choisir de payer sur place.
                Lorsque désactivé, seul le paiement sur place est proposé.
              </p>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                name="stripe_enabled"
                checked={config.stripe_enabled ?? false}
                onChange={handleChange}
              />
              <span className="toggle-slider" />
            </label>
          </div>
          <div className={`delivery-status ${config.stripe_enabled ? 'status-on' : 'status-off'}`}>
            {config.stripe_enabled ? '💳 Paiement carte activé' : '💶 Paiement sur place uniquement'}
          </div>
        </div>
      </div>

      {error && <p className="config-error">{error}</p>}
      {success && <p className="config-success">Configuration sauvegardée ✓</p>}

      <button className="btn btn-primary config-save-btn" onClick={handleSave} disabled={saving}>
        {saving ? 'Sauvegarde…' : 'Sauvegarder la configuration'}
      </button>

      <style>{`
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
        .section-header h2 { margin: 0; font-family: var(--font-display); font-weight: 600; font-size: 22px; letter-spacing: -0.3px; }
        .config-grid { display: grid; gap: 1px; grid-template-columns: 1fr; background: var(--color-border); border: 1px solid var(--color-border); }
        .config-block { padding: 24px; background: var(--color-surface); }
        .config-block h4 { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 18px; color: var(--color-red); }
        @media (min-width: 768px) { .config-grid { grid-template-columns: 1fr 1fr; } }
        @media (min-width: 1024px) { .config-grid { grid-template-columns: 1fr 1fr 1fr; } }
        .banner-preview { width: 100%; height: 140px; object-fit: cover; margin-bottom: 12px; border: 1px solid var(--color-border); }
        .banner-delete-btn { margin-top: 8px; margin-left: 8px; }
        .whatsapp-preview { margin-top: 16px; background: var(--color-paper-dim); padding: 12px 14px; border: 1px solid var(--color-border); }
        .whatsapp-preview-label { font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.5px; text-transform: uppercase; color: var(--color-text-muted); margin: 0 0 8px; }
        .whatsapp-preview-text { font-family: var(--font-mono); font-size: 12px; white-space: pre-wrap; margin: 0; color: var(--color-text); line-height: 1.6; }

        /* Livraison toggle */
        .delivery-toggle-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 14px; }
        .delivery-toggle-info { flex: 1; }
        .delivery-toggle-title { font-weight: 600; font-size: 13.5px; margin: 0 0 4px; color: var(--color-text); }
        .delivery-toggle-desc { font-size: 12px; color: var(--color-text-muted); margin: 0; line-height: 1.5; }
        .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; flex-shrink: 0; margin-top: 2px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider { position: absolute; inset: 0; background: var(--color-border-dark); transition: 0.3s; border-radius: 24px; cursor: pointer; }
        .toggle-slider:before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; bottom: 3px; background: white; transition: 0.3s; border-radius: 50%; }
        .toggle-switch input:checked + .toggle-slider { background: #2f6b3a; }
        .toggle-switch input:checked + .toggle-slider:before { transform: translateX(20px); }
        .delivery-status { font-size: 12.5px; font-weight: 600; padding: 10px 14px; border-radius: 0; }
        .status-on { background: rgba(47,107,58,0.1); color: #2f6b3a; border: 1px solid rgba(47,107,58,0.3); }
        .status-off { background: var(--color-paper-dim); color: var(--color-text-muted); border: 1px solid var(--color-border); }

        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .field label { font-size: 11px; font-weight: 700; font-family: var(--font-mono); text-transform: uppercase; letter-spacing: 0.8px; color: var(--color-text-muted); }
        .config-error { color: var(--color-red); margin-top: 16px; font-size: 13px; }
        .config-success { color: #2f6b3a; margin-top: 16px; font-size: 13px; font-weight: 600; }
        .config-save-btn { margin-top: 24px; }
        .btn-danger { background: var(--color-red); color: #fff; border-color: var(--color-red); }
        .btn-danger:hover { background: transparent; color: var(--color-red); }
      `}</style>
    </div>
  )
}
