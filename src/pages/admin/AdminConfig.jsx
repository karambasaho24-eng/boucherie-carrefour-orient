import { useEffect, useRef, useState } from 'react'
import { fetchSiteConfig, updateSiteConfig, uploadSiteImage } from '../../lib/api'

const THEME_COLORS = [
  { id: 'red',        label: 'Rouge (signature)', swatch: '#b5181f' },
  { id: 'green',      label: 'Vert',              swatch: '#1f7a3d' },
  { id: 'blue',       label: 'Bleu',              swatch: '#1452b5' },
  { id: 'gold',       label: 'Doré',              swatch: '#a87412' },
  { id: 'purple',     label: 'Violet',            swatch: '#6b2fb3' },
  { id: 'teal',       label: 'Bleu canard',       swatch: '#0d7a72' },
  { id: 'orange',     label: 'Orange',            swatch: '#c2540c' },
  { id: 'rose',       label: 'Rose',              swatch: '#c21d6e' },
  { id: 'slate',      label: 'Ardoise',           swatch: '#3d5a73' },
  { id: 'terracotta', label: 'Terracotta',        swatch: '#b4502f' },
]

export default function AdminConfig() {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const bannerRef = useRef()
  const logoRef = useRef()

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

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadSiteImage(file)
      setConfig((c) => ({ ...c, logo_url: url }))
    } catch {
      setError('Erreur upload logo.')
    } finally {
      setUploading(false)
    }
  }

  function handleThemeChange(themeId) {
    setConfig((c) => ({ ...c, theme_color: themeId }))
    document.documentElement.setAttribute('data-color-theme', themeId)
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
        logo_url: config.logo_url,
        about_title: config.about_title,
        about_text: config.about_text,
        theme_color: config.theme_color,
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

        <div className="config-block">
          <h4>Logo du site</h4>
          <p className="text-muted" style={{ fontSize: 12.5, marginTop: -6, marginBottom: 12 }}>
            Affiché dans le bandeau en haut du site, à la place du symbole par défaut.
          </p>
          {config.logo_url && (
            <img src={config.logo_url} alt="Logo" className="logo-preview" />
          )}
          <input ref={logoRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleLogoUpload} />
          <button className="btn btn-ghost btn-sm" onClick={() => logoRef.current.click()} disabled={uploading}>
            {uploading ? 'Upload…' : 'Choisir un logo'}
          </button>
          {config.logo_url && (
            <button className="btn btn-danger btn-sm banner-delete-btn" onClick={() => setConfig((c) => ({ ...c, logo_url: '' }))}>
              Supprimer
            </button>
          )}
        </div>

        <div className="config-block">
          <h4>Notre histoire</h4>
          <p className="text-muted" style={{ fontSize: 12.5, marginTop: -6, marginBottom: 12 }}>
            Affiché sur la page d'accueil, dans la section sombre dédiée à votre histoire.
          </p>
          <div className="field">
            <label>Titre de la section</label>
            <input className="input" name="about_title" value={config.about_title || ''} onChange={handleChange} placeholder="Notre histoire" />
