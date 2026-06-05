import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Clienti() {
  const [clienti, setClienti] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ragione_sociale: '', indirizzo: '' })

  useEffect(() => { loadClienti() }, [])

  async function loadClienti() {
    const { data } = await supabase.from('clienti').select('*').order('ragione_sociale')
    setClienti(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    await supabase.from('clienti').insert(form)
    setForm({ ragione_sociale: '', indirizzo: '' })
    setShowForm(false)
    setSaving(false)
    loadClienti()
  }

  async function elimina(id) {
    if (!confirm('Eliminare questo cliente? Tutti i suoi dati verranno persi.')) return
    await supabase.from('clienti').delete().eq('id', id)
    loadClienti()
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}><div className="spinner" /></div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>🏢 Clienti</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px' }}>Gestisci le aziende clienti</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annulla' : '+ Nuovo cliente'}
        </button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '24px', borderColor: 'var(--accent)' }}>
          <h3 style={{ marginBottom: '20px' }}>Aggiungi cliente</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Ragione sociale *</label>
                <input value={form.ragione_sociale} onChange={e => setForm({ ...form, ragione_sociale: e.target.value })} placeholder="Es. Ristorante Roma S.r.l." required />
              </div>
              <div className="form-group">
                <label>Indirizzo</label>
                <input value={form.indirizzo} onChange={e => setForm({ ...form, indirizzo: e.target.value })} placeholder="Es. Via Roma 1, Aprilia (LT)" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvataggio...' : '✓ Aggiungi cliente'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div style={{ display: 'grid', gap: '12px' }}>
        {clienti.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🏢</div>
            <p style={{ color: 'var(--text2)' }}>Nessun cliente ancora. Aggiungine uno per iniziare.</p>
          </div>
        ) : clienti.map(c => (
          <div key={c.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '16px' }}>{c.ragione_sociale}</div>
              {c.indirizzo && <div style={{ color: 'var(--text2)', fontSize: '13px', marginTop: '3px' }}>📍 {c.indirizzo}</div>}
              <div style={{ color: 'var(--text3)', fontSize: '12px', marginTop: '3px' }}>
                Aggiunto il {new Date(c.created_at).toLocaleDateString('it-IT')}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn-danger" onClick={() => elimina(c.id)}>🗑 Elimina</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
