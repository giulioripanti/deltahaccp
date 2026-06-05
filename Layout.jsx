import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const menuConsulente = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'clienti', icon: '🏢', label: 'Clienti' },
  { id: 'utenti', icon: '👥', label: 'Utenti' },
  { id: 'documenti', icon: '📁', label: 'Documenti' },
]

const menuCliente = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'temperature', icon: '🌡️', label: 'Temperature' },
  { id: 'pulizie', icon: '🧹', label: 'Pulizie' },
  { id: 'lotti', icon: '📦', label: 'Lotti' },
  { id: 'documenti', icon: '📁', label: 'Documenti' },
]

export default function Layout({ children, activePage, setActivePage }) {
  const { profilo, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isConsulente = profilo?.ruolo === 'consulente'
  const menu = isConsulente ? menuConsulente : menuCliente

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{
        width: '240px',
        background: 'var(--bg2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0, left: 0, bottom: 0,
        zIndex: 100,
        transition: 'transform 0.3s',
        transform: mobileOpen ? 'translateX(0)' : undefined
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <div style={{
            width: '34px', height: '34px',
            background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', flexShrink: 0
          }}>🛡️</div>
          <div>
            <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: '17px' }}>DeltaHACCP</div>
            <div style={{ fontSize: '11px', color: 'var(--accent)', fontWeight: 600 }}>
              {isConsulente ? 'CONSULENTE' : 'CLIENTE'}
            </div>
          </div>
        </div>

        {/* Profilo */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '13px', color: 'var(--text2)' }}>Connesso come</div>
          <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
            {profilo?.nome_completo || 'Utente'}
          </div>
          {!isConsulente && profilo?.clienti && (
            <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
              {profilo.clienti.ragione_sociale}
            </div>
          )}
        </div>

        {/* Menu */}
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => { setActivePage(item.id); setMobileOpen(false) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: activePage === item.id ? 'rgba(0,212,160,0.12)' : 'transparent',
                color: activePage === item.id ? 'var(--accent)' : 'var(--text2)',
                marginBottom: '2px',
                textAlign: 'left',
                fontWeight: activePage === item.id ? 600 : 400,
                transition: 'all 0.15s'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px 10px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={logout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '8px',
              background: 'transparent', color: 'var(--text3)',
              textAlign: 'left'
            }}
          >
            <span>🚪</span>
            <span>Esci</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <main style={{
        marginLeft: '240px',
        flex: 1,
        padding: '32px',
        minHeight: '100vh',
        background: 'var(--bg)'
      }}>
        {children}
      </main>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 99
          }}
        />
      )}

      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        style={{
          display: 'none',
          position: 'fixed',
          top: '16px', left: '16px',
          zIndex: 200,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
          padding: '8px',
          borderRadius: '8px',
          fontSize: '18px'
        }}
      >
        ☰
      </button>

      <style>{`
        @media (max-width: 768px) {
          aside { transform: translateX(-100%); }
          main { margin-left: 0 !important; padding: 16px !important; }
          button[style*="display: none"] { display: flex !important; }
        }
      `}</style>
    </div>
  )
}
