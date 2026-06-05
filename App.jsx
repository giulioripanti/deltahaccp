import { useState } from 'react'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Temperature from './pages/Temperature'
import Pulizie from './pages/Pulizie'
import Lotti from './pages/Lotti'
import Documenti from './pages/Documenti'
import Clienti from './pages/Clienti'
import Utenti from './pages/Utenti'

function AppInner() {
  const { user, profilo, loading } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        gap: '16px'
      }}>
        <div className="spinner" />
        <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Caricamento DeltaHACCP...</p>
      </div>
    )
  }

  if (!user) return <Login />

  const isConsulente = profilo?.ruolo === 'consulente'

  function renderPage() {
    switch (activePage) {
      case 'dashboard': return <Dashboard setActivePage={setActivePage} />
      case 'temperature': return <Temperature />
      case 'pulizie': return <Pulizie />
      case 'lotti': return <Lotti />
      case 'documenti': return <Documenti />
      case 'clienti': return isConsulente ? <Clienti /> : <Dashboard setActivePage={setActivePage} />
      case 'utenti': return isConsulente ? <Utenti /> : <Dashboard setActivePage={setActivePage} />
      default: return <Dashboard setActivePage={setActivePage} />
    }
  }

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {renderPage()}
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
