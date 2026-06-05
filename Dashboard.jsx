import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard({ setActivePage }) {
  const { profilo } = useAuth()
  const isConsulente = profilo?.ruolo === 'consulente'
  const [stats, setStats] = useState({})
  const [ultimiRecord, setUltimiRecord] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    if (isConsulente) {
      const [{ count: clienti }, { count: utenti }, { count: documenti }] = await Promise.all([
        supabase.from('clienti').select('*', { count: 'exact', head: true }),
        supabase.from('profili').select('*', { count: 'exact', head: true }).eq('ruolo', 'cliente'),
        supabase.from('documenti').select('*', { count: 'exact', head: true }),
      ])
      setStats({ clienti, utenti, documenti })

      const { data } = await supabase
        .from('temperature')
        .select('*, clienti(ragione_sociale)')
        .order('created_at', { ascending: false })
        .limit(5)
      setUltimiRecord(data || [])
    } else {
      const clienteId = profilo?.cliente_id
      const [{ count: temp }, { count: pul }, { count: lotti }, { count: docs }] = await Promise.all([
        supabase.from('temperature').select('*', { count: 'exact', head: true }).eq('cliente_id', clienteId),
        supabase.from('pulizie').select('*', { count: 'exact', head: true }).eq('cliente_id', clienteId),
        supabase.from('lotti').select('*', { count: 'exact', head: true }).eq('cliente_id', clienteId),
        supabase.from('documenti').select('*', { count: 'exact', head: true }).eq('cliente_id', clienteId),
      ])
      setStats({ temperature: temp, pulizie: pul, lotti, documenti: docs })

      const { data } = await supabase
        .from('temperature')
        .select('*')
        .eq('cliente_id', clienteId)
        .order('created_at', { ascending: false })
        .limit(5)
      setUltimiRecord(data || [])
    }
    setLoading(false)
  }

  const oggi = new Date().toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}><div className="spinner" /></div>

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <p style={{ color: 'var(--text2)', fontSize: '14px', marginBottom: '4px' }}>{oggi}</p>
        <h1 style={{ fontSize: '32px' }}>
          Benvenuto{isConsulente ? ', Giulio' : ''}
        </h1>
        <p style={{ color: 'var(--text2)', marginTop: '6px' }}>
          {isConsulente ? 'Pannello consulente DeltaControl S.r.l.' : `${profilo?.clienti?.ragione_sociale || ''} — Pannello HACCP`}
        </p>
      </div>

      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        {isConsulente ? (
          <>
            <StatCard icon="🏢" label="Clienti attivi" value={stats.clienti ?? 0} color="var(--accent)" onClick={() => setActivePage('clienti')} />
            <StatCard icon="👥" label="Utenti totali" value={stats.utenti ?? 0} color="var(--accent2)" onClick={() => setActivePage('utenti')} />
            <StatCard icon="📁" label="Documenti caricati" value={stats.documenti ?? 0} color="var(--warn)" onClick={() => setActivePage('documenti')} />
          </>
        ) : (
          <>
            <StatCard icon="🌡️" label="Temperature" value={stats.temperature ?? 0} color="var(--danger)" onClick={() => setActivePage('temperature')} />
            <StatCard icon="🧹" label="Pulizie" value={stats.pulizie ?? 0} color="var(--accent)" onClick={() => setActivePage('pulizie')} />
            <StatCard icon="📦" label="Lotti" value={stats.lotti ?? 0} color="var(--accent2)" onClick={() => setActivePage('lotti')} />
            <StatCard icon="📁" label="Documenti" value={stats.documenti ?? 0} color="var(--warn)" onClick={() => setActivePage('documenti')} />
          </>
        )}
      </div>

      {/* Ultime registrazioni */}
      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '17px' }}>
          {isConsulente ? 'Ultime temperature registrate' : 'Ultime temperature'}
        </h3>
        {ultimiRecord.length === 0 ? (
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Nessuna registrazione ancora</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {isConsulente && <th style={thStyle}>Cliente</th>}
                <th style={thStyle}>Punto misura</th>
                <th style={thStyle}>Temperatura</th>
                <th style={thStyle}>Operatore</th>
                <th style={thStyle}>Data</th>
              </tr>
            </thead>
            <tbody>
              {ultimiRecord.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  {isConsulente && <td style={tdStyle}>{r.clienti?.ragione_sociale}</td>}
                  <td style={tdStyle}>{r.punto_misura}</td>
                  <td style={tdStyle}>
                    <span style={{
                      color: r.valore > 8 ? 'var(--danger)' : r.valore < -15 ? 'var(--accent2)' : 'var(--accent)',
                      fontWeight: 600
                    }}>
                      {r.valore}°C
                    </span>
                  </td>
                  <td style={tdStyle}>{r.operatore || '—'}</td>
                  <td style={tdStyle}>{new Date(r.created_at).toLocaleDateString('it-IT')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color, onClick }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        transition: 'all 0.2s',
        borderColor: 'var(--border)',
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = color}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ fontSize: '28px', marginBottom: '12px' }}>{icon}</div>
      <div style={{ fontSize: '32px', fontWeight: 700, color, marginBottom: '4px' }}>{value}</div>
      <div style={{ color: 'var(--text2)', fontSize: '13px' }}>{label}</div>
    </div>
  )
}

const thStyle = {
  textAlign: 'left',
  padding: '8px 12px',
  fontSize: '12px',
  color: 'var(--text2)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const tdStyle = {
  padding: '10px 12px',
  fontSize: '14px'
}
