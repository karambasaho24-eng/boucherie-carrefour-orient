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
    setConfig((c) => ({ ...c, [e.target.name]: e.target.value }))
  }

  async function handleBannerUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadSiteImage(file)
      setConfig((c) => ({ ...c, banner_image: url }))
    } catch {
      setError("Erreur upload bannière.")
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
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch {
      setError("Erreur lors de la sauvegarde.")
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
        <div className="card config-block">
          <h4>🏪 Identité</h4>
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

        <div className="card config-block">
          <h4>📞 Contact & Horaires</h4>
          <div className="field">
            <label>Téléphone</label>
            <input className="input" name="phone" value={config.phone || ''} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Adresse</label>
            <input className="input" name="address" value={config.address || ''} onChange={handleChange} />
          </div>
          <div className="field">
            <label>Horaires d'ouverture</label>
            <input className="input" name="opening_hours" value={config.opening_hours || ''} onChange={handleChange} placeholder="09:30 - 19:30" />
          </div>
        </div>

        <div className="card config-block">
          <h4>🖼️ Image bannière</h4>
          {config.banner_image && (
            <img src={config.banner_image} alt="Bannière" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
          )}
          <input ref={bannerRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleBannerUpload} />
          <button className="btn btn-outline btn-sm" onClick={() => bannerRef.current.click()} disabled={uploading}>
            {uploading ? '⏳ Upload...' : '📷 Prendre une photo / Choisir une image'}
          </button>
          {config.banner_image && (
            <button className="btn btn-danger btn-sm" style={{ marginTop: 6 }} onClick={() => setConfig(c => ({ ...c, banner_image: '' }))}>
              🗑️ Supprimer
            </button>
          )}
        </div>

        <div className="card config-block">
          <h4>💬 Commande & WhatsApp</h4>
          <div className="field">
            <label>Numéro WhatsApp</label>
            <input
              className="input"
              name="whatsapp_number"
              value={config.whatsapp_number || ''}
              onChange={handleChange}
              placeholder="+33243410951"
            />
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
              <p className="text-muted" style={{ fontSize: 12, margin: '0 0 6px' }}>Aperçu du message envoyé :</p>
              <pre className="whatsapp-preview-text">{`🧾 *Commande #ABCD1234*
👤 Nom du client
📞 ${config.whatsapp_number}

• Produit x1 — 10.00 €

💰 *Total : 10.00 €*`}</pre>
            </div>
          )}
        </div>
      </div>

      {error && <p style={{ color: 'var(--color-danger)', marginTop: 12 }}>{error}</p>}
      {success && <p style={{ color: 'var(--color-success)', marginTop: 12 }}>✅ Configuration sauvegardée !</p>}

      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={handleSave} disabled={saving}>
        {saving ? 'Sauvegarde...' : '💾 Sauvegarder la configuration'}
      </button>

      <style>{`
        .section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .section-header h2 { margin: 0; }
        .config-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
        .config-block { padding: 20px; }
        .config-block h4 { margin: 0 0 14px; color: var(--color-primary); }
        @media (min-width: 768px) {
          .config-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 1024px) {
          .config-grid { grid-template-columns: 1fr 1fr 1fr; }
        }
        .whatsapp-preview {
          margin-top: 14px;
          background: var(--color-bg);
          border-radius: 8px;
          padding: 10px 12px;
          border: 1px solid var(--color-border);
        }
        .whatsapp-preview-text {
          font-family: var(--font-body);
          font-size: 12px;
          white-space: pre-wrap;
          margin: 0;
          color: var(--color-text);
        }
      `}</style>
    </div>
  )
}
