import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const PUNTI_DEFAULT = ['Frigorifero 1', 'Frigorifero 2', 'Congelatore', 'Abbattitore', 'Banco frigo', 'Cottura', 'Conservazione calda']

export default function Temperature() {
  const { profilo } = useAuth()
  const clienteId = profilo?.cliente_id
  const [records, setRecords] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [foto, setFoto] = useState(null)
  const [form, setForm] = useState({
    punto_misura: '',
    valore: '',
    operatore: '',
    note: ''
  })

  useEffect(() => { loadRecords() }, [])

  async function loadRecords() {
    const { data } = await supabase
      .from('temperature')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('created_at', { ascending: false })
    setRecords(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)

    let foto_url = null
    if (foto) {
      const ext = foto.name.split('.').pop()
      const path = `temp_${Date.now()}.${ext}`
      const { data: up } = await supabase.storage.from('foto').upload(path, foto)
      if (up) {
        const { data: url } = supabase.storage.from('foto').getPublicUrl(path)
        foto_url = url.publicUrl
      }
    }

    await supabase.from('temperature').insert({
      cliente_id: clienteId,
      punto_misura: form.punto_misura,
      valore: parseFloat(form.valore),
      operatore: form.operatore,
      note: form.note,
      foto_url,
      registrato_da: profilo.id
    })

    setForm({ punto_misura: '', valore: '', operatore: '', note: '' })
    setFoto(null)
    setShowForm(false)
    setSaving(false)
    loadRecords()
  }

  function getColorTemp(val) {
    if (val > 8) return 'var(--danger)'
    if (val < -25) return 'var(--accent2)'
    return 'var(--accent)'
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}><div className="spinner" /></div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>🌡️ Temperature</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px' }}>Registra e monitora le temperature</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annulla' : '+ Nuova registrazione'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '24px', borderColor: 'var(--accent)' }}>
          <h3 style={{ marginBottom: '20px' }}>Nuova rilevazione</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Punto di misura *</label>
                <select value={form.punto_misura} onChange={e => setForm({ ...form, punto_misura: e.target.value })} required>
                  <option value="">Seleziona...</option>
                  {PUNTI_DEFAULT.map(p => <option key={p}>{p}</option>)}
                  <option value="__altro">Altro (digita sotto)</option>
                </select>
              </div>
              {form.punto_misura === '__altro' && (
                <div className="form-group">
                  <label>Specifica punto</label>
                  <input placeholder="Es. Vetrina pesce" onChange={e => setForm({ ...form, punto_misura: e.target.value })} required />
                </div>
              )}
              <div className="form-group">
                <label>Temperatura (°C) *</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.valore}
                  onChange={e => setForm({ ...form, valore: e.target.value })}
                  placeholder="Es. 4.2"
                  required
                />
              </div>
              <div className="form-group">
                <label>Operatore</label>
                <input
                  value={form.operatore}
                  onChange={e => setForm({ ...form, operatore: e.target.value })}
                  placeholder="Nome e cognome"
                />
              </div>
              <div className="form-group">
                <label>Note</label>
                <input
                  value={form.note}
                  onChange={e => setForm({ ...form, note: e.target.value })}
                  placeholder="Note opzionali"
                />
              </div>
              <div className="form-group">
                <label>Foto (opzionale)</label>
                <input type="file" accept="image/*" onChange={e => setFoto(e.target.files[0])} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Salvataggio...' : '✓ Salva rilevazione'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annulla</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabella */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '16px' }}>Storico rilevazioni ({records.length})</h3>
        </div>
        {records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🌡️</div>
            <p>Nessuna rilevazione ancora. Inizia registrando la prima temperatura.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={thStyle}>Data/Ora</th>
                  <th style={thStyle}>Punto di misura</th>
                  <th style={thStyle}>Temperatura</th>
                  <th style={thStyle}>Operatore</th>
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
                    <td style={tdStyle}>{r.punto_misura}</td>
                    <td style={tdStyle}>
                      <span style={{
                        color: getColorTemp(r.valore),
                        fontWeight: 700,
                        fontSize: '16px'
                      }}>
                        {r.valore}°C
                      </span>
                      {r.valore > 8 && <span style={{ marginLeft: '6px' }} className="badge badge-red">⚠ Fuori soglia</span>}
                    </td>
                    <td style={tdStyle}>{r.operatore || '—'}</td>
                    <td style={tdStyle}><span style={{ color: 'var(--text2)', fontSize: '13px' }}>{r.note || '—'}</span></td>
                    <td style={tdStyle}>
                      {r.foto_url ? (
                        <a href={r.foto_url} target="_blank" rel="noreferrer">
                          <img src={r.foto_url} alt="foto" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                        </a>
                      ) : '—'}
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
