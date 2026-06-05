import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

export default function Lotti() {
  const { profilo } = useAuth()
  const clienteId = profilo?.cliente_id
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [foto, setFoto] = useState(null)
  const [cerca, setCerca] = useState('')
  const [form, setForm] = useState({ numero_lotto: '', prodotto: '', fornitore: '', data_scadenza: '', quantita: '', note: '' })

  useEffect(() => { loadRecords() }, [])

  async function loadRecords() {
    const { data } = await supabase.from('lotti').select('*').eq('cliente_id', clienteId).order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    let foto_url = null
    if (foto) {
      const ext = foto.name.split('.').pop()
      const path = `lotto_${Date.now()}.${ext}`
      const { data: up } = await supabase.storage.from('foto').upload(path, foto)
      if (up) {
        const { data: url } = supabase.storage.from('foto').getPublicUrl(path)
        foto_url = url.publicUrl
      }
    }
    await supabase.from('lotti').insert({ cliente_id: clienteId, ...form, foto_url, registrato_da: profilo.id })
    setForm({ numero_lotto: '', prodotto: '', fornitore: '', data_scadenza: '', quantita: '', note: '' })
    setFoto(null)
    setShowForm(false)
    setSaving(false)
    loadRecords()
  }

  const filtered = records.filter(r =>
    r.prodotto?.toLowerCase().includes(cerca.toLowerCase()) ||
    r.numero_lotto?.toLowerCase().includes(cerca.toLowerCase()) ||
    r.fornitore?.toLowerCase().includes(cerca.toLowerCase())
  )

  function scadenzaStatus(data) {
    if (!data) return null
    const diff = (new Date(data) - new Date()) / (1000 * 60 * 60 * 24)
    if (diff < 0) return { label: 'Scaduto', cls: 'badge-red' }
    if (diff < 7) return { label: 'Scade presto', cls: 'badge-yellow' }
    return { label: new Date(data).toLocaleDateString('it-IT'), cls: 'badge-green' }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}><div className="spinner" /></div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>📦 Lotti rintracciabilità</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px' }}>Registro carico merci e lotti</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annulla' : '+ Nuovo lotto'}
        </button>
      </div>

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '24px', borderColor: 'var(--accent2)' }}>
          <h3 style={{ marginBottom: '20px' }}>Registra nuovo lotto</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Numero lotto *</label>
                <input value={form.numero_lotto} onChange={e => setForm({ ...form, numero_lotto: e.target.value })} placeholder="Es. L2024001" required />
              </div>
              <div className="form-group">
                <label>Prodotto *</label>
                <input value={form.prodotto} onChange={e => setForm({ ...form, prodotto: e.target.value })} placeholder="Es. Prosciutto cotto" required />
              </div>
              <div className="form-group">
                <label>Fornitore</label>
                <input value={form.fornitore} onChange={e => setForm({ ...form, fornitore: e.target.value })} placeholder="Es. Salumificio Rossi S.r.l." />
              </div>
              <div className="form-group">
                <label>Data scadenza / TMC</label>
                <input type="date" value={form.data_scadenza} onChange={e => setForm({ ...form, data_scadenza: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Quantità</label>
                <input value={form.quantita} onChange={e => setForm({ ...form, quantita: e.target.value })} placeholder="Es. 5 kg / 10 pz" />
              </div>
              <div className="form-group">
                <label>Note</label>
                <input value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} placeholder="Note aggiuntive" />
              </div>
              <div className="form-group">
                <label>Foto etichetta (opzionale)</label>
                <input type="file" accept="image/*" onChange={e => setFoto(e.target.files[0])} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvataggio...' : '✓ Salva lotto'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annulla</button>
            </div>
          </form>
        </div>
      )}

      {/* Ricerca */}
      <div style={{ marginBottom: '16px' }}>
        <input value={cerca} onChange={e => setCerca(e.target.value)} placeholder="🔍 Cerca per prodotto, lotto o fornitore..." />
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Registro lotti ({filtered.length})</h3>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📦</div>
            <p>{cerca ? 'Nessun risultato trovato.' : 'Nessun lotto registrato ancora.'}</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Data carico</th>
                  <th style={thStyle}>N° Lotto</th>
                  <th style={thStyle}>Prodotto</th>
                  <th style={thStyle}>Fornitore</th>
                  <th style={thStyle}>Scadenza</th>
                  <th style={thStyle}>Quantità</th>
                  <th style={thStyle}>Foto</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => {
                  const sc = scadenzaStatus(r.data_scadenza)
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={tdStyle}>{new Date(r.created_at).toLocaleDateString('it-IT')}</td>
                      <td style={tdStyle}><code style={{ background: 'var(--bg3)', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>{r.numero_lotto}</code></td>
                      <td style={tdStyle}><strong>{r.prodotto}</strong></td>
                      <td style={tdStyle}>{r.fornitore || '—'}</td>
                      <td style={tdStyle}>{sc ? <span className={`badge ${sc.cls}`}>{sc.label}</span> : '—'}</td>
                      <td style={tdStyle}>{r.quantita || '—'}</td>
                      <td style={tdStyle}>
                        {r.foto_url
                          ? <a href={r.foto_url} target="_blank" rel="noreferrer"><img src={r.foto_url} alt="etichetta" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} /></a>
                          : '—'}
                      </td>
                    </tr>
                  )
                })}
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
