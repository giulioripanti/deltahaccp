import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const AREE = ['Cucina', 'Sala', 'Bagni', 'Magazzino', 'Cella frigorifera', 'Banco cassa', 'Zona lavaggio', 'Esterno']
const TIPI = ['Pulizia ordinaria', 'Pulizia straordinaria', 'Sanificazione', 'Disinfezione', 'Derattizzazione', 'Disinfestazione']

export default function Pulizie() {
  const { profilo } = useAuth()
  const clienteId = profilo?.cliente_id
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [foto, setFoto] = useState(null)
  const [form, setForm] = useState({ area: '', tipo_pulizia: '', operatore: '', note: '', eseguita: true })

  useEffect(() => { loadRecords() }, [])

  async function loadRecords() {
    const { data } = await supabase.from('pulizie').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    let foto_url = null
    if (foto) {
      const ext = foto.name.split('.').pop()
      const path = `pul_${Date.now()}.${ext}`
      const { data: up } = await supabase.storage.from('foto').upload(path, foto)
      if (up) {
        const { data: url } = supabase.storage.from('foto').getPublicUrl(path)
        foto_url = url.publicUrl
      }
    }
    await supabase.from('pulizie').insert({
      cliente_id: clienteId, ...form, foto_url, registrato_da: profilo.id
    })
    setForm({ area: '', tipo_pulizia: '', operatore: '', note: '', eseguita: true })
    setFoto(null)
    setShowForm(false)
    setSaving(false)
    loadRecords()
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}><div className="spinner" /></div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>🧹 Pulizie</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px' }}>Registro delle operazioni di pulizia e sanificazione</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annulla' : '+ Nuova registrazione'}
        </button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '24px', borderColor: 'var(--accent)' }}>
          <h3 style={{ marginBottom: '20px' }}>Nuova operazione pulizia</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Area *</label>
                <select value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} required>
                  <option value="">Seleziona area...</option>
                  {AREE.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Tipo operazione *</label>
                <select value={form.tipo_pulizia} onChange={e => setForm({ ...form, tipo_pulizia: e.target.value })} required>
                  <option value="">Seleziona tipo...</option>
                  {TIPI.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Operatore *</label>
                <input value={form.operatore} onChange={e => setForm({ ...form, operatore: e.target.value })} placeholder="Nome e cognome" required />
              </div>
              <div className="form-group">
                <label>Esito</label>
                <select value={form.eseguita} onChange={e => setForm({ ...form, eseguita: e.target.value === 'true' })}>
                  <option value="true">✅ Eseguita correttamente</option>
                  <option value="false">❌ Non eseguita / anomalia</option>
                </select>
              </div>
              <div className="form-group">
                <label>Note</label>
                <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Prodotti usati, anomalie, ecc." />
              </div>
              <div className="form-group">
                <label>Foto (opzionale)</label>
                <input type="file" accept="image/*" onChange={e => setFoto(e.target.files[0])} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvataggio...' : '✓ Salva'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Storico pulizie ({records.length})</h3>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🧹</div>
            <p>Nessuna operazione registrata.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Data/Ora</th>
                  <th style={thStyle}>Area</th>
                  <th style={thStyle}>Tipo</th>
                  <th style={thStyle}>Operatore</th>
                  <th style={thStyle}>Esito</th>
                  <th style={thStyle}>Note</th>
                  <th style={thStyle}>Foto</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={tdStyle}>
                      <div style={{ fontSize: '13px' }}>{new Date(r.created_at).toLocaleDateString('it-IT')}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{new Date(r.created_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</div>
                    </td>
                    <td style={tdStyle}>{r.area}</td>
                    <td style={tdStyle}>{r.tipo_pulizia}</td>
                    <td style={tdStyle}>{r.operatore}</td>
                    <td style={tdStyle}>
                      {r.eseguita
                        ? <span className="badge badge-green">✅ Eseguita</span>
                        : <span className="badge badge-red">❌ Anomalia</span>}
                    </td>
                    <td style={tdStyle}><span style={{ color: 'var(--text2)', fontSize: '13px' }}>{r.note || '—'}</span></td>
                    <td style={tdStyle}>
                      {r.foto_url
                        ? <a href={r.foto_url} target="_blank" rel="noreferrer"><img src={r.foto_url} alt="foto" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} /></a>
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

const thStyle = { textAlign: 'left', padding: '8px 12px', fontSize: '12px', color: 'var(--text2)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }
const tdStyle = { padding: '10px 12px', fontSize: '14px' }
