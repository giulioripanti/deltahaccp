import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await login(email, password)
    if (error) setError('Email o password non corretti')
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '20px'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(0,212,160,0.06) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(0,153,255,0.06) 0%, transparent 60%)',
        pointerEvents: 'none'
      }} />

      <div className="fade-in" style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px'
          }}>
            <div style={{
              width: '42px', height: '42px',
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px'
            }}>🛡️</div>
            <h1 style={{ fontSize: '28px', color: 'var(--text)' }}>DeltaHACCP</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Gestione sicurezza alimentare</p>
        </div>

        {/* Card login */}
        <div className="card" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>Accedi</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tua@email.com"
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(255,77,109,0.1)',
                border: '1px solid rgba(255,77,109,0.3)',
                color: 'var(--danger)',
                padding: '10px 14px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '15px' }}
              disabled={loading}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', color: 'var(--text3)', fontSize: '13px', marginTop: '24px' }}>
          DeltaControl S.r.l. — Sistema HACCP
        </p>
      </div>
    </div>
  )
}
