import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()

  async function handleLogin() {
    if (!email || !password) { setError('Champs obligatoires.'); return }
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      await refreshProfile()
      navigate('/admin')
    } catch (err) {
      setError('Email ou mot de passe incorrect.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card">
        <h2>🔑 Administration</h2>
        <p className="text-muted">Boucherie Le Carrefour d'Orient</p>

        <div className="field">
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@email.com" />
        </div>
        <div className="field">
          <label>Mot de passe</label>
          <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        {error && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>}

        <button className="btn btn-primary btn-block" onClick={handleLogin} disabled={loading}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: var(--color-bg);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 32px 24px;
        }
        .login-card h2 { margin: 0 0 4px; }
        .login-card .text-muted { margin: 0 0 24px; }
      `}</style>
    </div>
  )
}
