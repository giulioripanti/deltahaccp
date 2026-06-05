import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const ICONE = {
  pdf: '📄', doc: '📝', docx: '📝', xls: '📊', xlsx: '📊',
  jpg: '🖼️', jpeg: '🖼️', png: '🖼️', default: '📎'
}

function getIcona(nome) {
  const ext = nome?.split('.').pop()?.toLowerCase()
  return ICONE[ext] || ICONE.default
}

export default function Documenti() {
  const { profilo } = useAuth()
  const isConsulente = profilo?.ruolo === 'consulente'
  const [docs, setDocs] = useState([])
  const [clienti, setClienti] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState(null)
  const [form, setForm] = useState({ cliente_id: '', descrizione: '' })
  const [filtroCliente, setFiltroCliente] = useState('')

  useEffect(() => {
    loadDocs()
    if (isConsulente) loadClienti()
  }, [])

  async function loadClienti() {
    const { data } = await supabase.from('clienti').select('*').order('ragione_sociale')
    setClienti(data || [])
  }

  async function loadDocs() {
    let query = supabase.from('documenti').select('*, clienti(ragione_sociale)').order('created_at', { ascending: false })
    if (!isConsulente) query = query.eq('cliente_id', profilo.cliente_id)
    const { data } = await query
    setDocs(data || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!file) return
    setSaving(true)
    const ext = file.name.split('.').pop()
    const path = `doc_${Date.now()}.${ext}`
    const { data: up } = await supabase.storage.from('documenti').upload(path, file)
    if (up) {
      const { data: url } = supabase.storage.from('documenti').getPublicUrl(path)
      await supabase.from('documenti').insert({
        cliente_id: form.cliente_id,
        nome_file: file.name,
        descrizione: form.descrizione,
        file_url: url.publicUrl,
        caricato_da: profilo.id
      })
    }
    setForm({ cliente_id: '', descrizione: '' })
    setFile(null)
    setShowForm(false)
    setSaving(false)
    loadDocs()
  }

  async function elimina(id, fileUrl) {
    if (!confirm('Eliminare questo documento?')) return
    await supabase.from('documenti').delete().eq('id', id)
    loadDocs()
  }

  const filtered = filtroCliente
    ? docs.filter(d => d.cliente_id === filtroCliente)
    : docs

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}><div className="spinner" /></div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>📁 Documenti</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px' }}>
            {isConsulente ? 'Carica e gestisci documenti per i clienti' : 'Documenti condivisi dal consulente'}
          </p>
        </div>
        {isConsulente && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annulla' : '+ Carica documento'}
          </button>
        )}
      </div>

      {isConsulente && showForm && (
        <div className="card fade-in" style={{ marginBottom: '24px', borderColor: 'var(--warn)' }}>
          <h3 style={{ marginBottom: '20px' }}>Carica nuovo documento</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Cliente destinatario *</label>
                <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} required>
                  <option value="">Seleziona cliente...</option>
                  {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Descrizione</label>
                <input value={form.descrizione} onChange={e => setForm({ ...form, descrizione: e.target.value })} placeholder="Es. Piano HACCP 2024, Scheda tecnica..." />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label>File *</label>
                <input type="file" onChange={e => setFile(e.target.files[0])} required />
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>PDF, Word, Excel, immagini — max 50MB</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Caricamento...' : '⬆ Carica documento'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annulla</button>
            </div>
          </form>
        </div>
      )}

      {/* Filtro per consulente */}
      {isConsulente && clienti.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} style={{ maxWidth: '300px' }}>
            <option value="">Tutti i clienti</option>
            {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale}</option>)}
          </select>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Documenti ({filtered.length})</h3>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📁</div>
            <p>{isConsulente ? 'Nessun documento caricato. Usa il pulsante sopra per aggiungere.' : 'Nessun documento disponibile. Il consulente non ha ancora caricato documenti.'}</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {filtered.map(doc => (
              <div key={doc.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                background: 'var(--bg3)',
                borderRadius: '10px',
                border: '1px solid var(--border)',
                transition: 'border-color 0.2s'
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: '28px' }}>{getIcona(doc.nome_file)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {doc.nome_file}
                  </div>
                  {doc.descrizione && <div style={{ fontSize: '13px', color: 'var(--text2)' }}>{doc.descrizione}</div>}
                  <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                    {isConsulente && doc.clienti && <span style={{ marginRight: '12px' }}>🏢 {doc.clienti.ragione_sociale}</span>}
                    📅 {new Date(doc.created_at).toLocaleDateString('it-IT')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'var(--accent)',
                      color: '#0f1117',
                      padding: '7px 14px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: 600,
                      textDecoration: 'none'
                    }}
                  >
                    ⬇ Scarica
                  </a>
                  {isConsulente && (
                    <button
                      className="btn-danger"
                      style={{ fontSize: '12px', padding: '7px 12px' }}
                      onClick={() => elimina(doc.id, doc.file_url)}
                    >
                      🗑
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
