import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Utenti() {
  const [utenti, setUtenti] = useState([])
  const [clienti, setClienti] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [form, setForm] = useState({ email: '', password: '', nome_completo: '', cliente_id: '' })

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [{ data: u }, { data: c }] = await Promise.all([
      supabase.from('profili').select('*, clienti(ragione_sociale)').eq('ruolo', 'cliente').order('created_at', { ascending: false }),
      supabase.from('clienti').select('*').order('ragione_sociale')
    ])
    setUtenti(u || [])
    setClienti(c || [])
    setLoading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)

    // Crea utente via Supabase Admin (funziona solo con service role key)
    // Per ora usiamo il metodo pubblico con invite
    const { data, error } = await supabase.auth.admin?.createUser({
      email: form.email,
      password: form.password,
      email_confirm: true
    })

    if (error) {
      // Fallback: mostra istruzioni manuali
      setMsg({
        type: 'info',
        text: `Per creare l'utente "${form.email}", vai su Supabase → Authentication → Users → "Add user". Usa email: ${form.email} e password: ${form.password}. Poi torna qui e aggiorna la pagina per assegnare il cliente.`
      })
      setSaving(false)
      return
    }

    // Crea profilo
    await supabase.from('profili').insert({
      id: data.user.id,
      cliente_id: form.cliente_id,
      ruolo: 'cliente',
      nome_completo: form.nome_completo
    })

    setMsg({ type: 'success', text: `Utente ${form.email} creato con successo!` })
    setForm({ email: '', password: '', nome_completo: '', cliente_id: '' })
    setShowForm(false)
    setSaving(false)
    loadAll()
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '80px' }}><div className="spinner" /></div>

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px' }}>👥 Utenti clienti</h1>
          <p style={{ color: 'var(--text2)', marginTop: '4px' }}>Gestisci gli accessi dei tuoi clienti</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Annulla' : '+ Nuovo utente'}
        </button>
      </div>

      {msg && (
        <div style={{
          background: msg.type === 'success' ? 'rgba(0,212,160,0.1)' : 'rgba(0,153,255,0.1)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(0,212,160,0.3)' : 'rgba(0,153,255,0.3)'}`,
          color: msg.type === 'success' ? 'var(--accent)' : 'var(--accent2)',
          padding: '14px 18px',
          borderRadius: '10px',
          marginBottom: '20px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          {msg.type === 'success' ? '✅ ' : 'ℹ️ '}{msg.text}
        </div>
      )}

      {showForm && (
        <div className="card fade-in" style={{ marginBottom: '24px', borderColor: 'var(--accent2)' }}>
          <h3 style={{ marginBottom: '20px' }}>Crea accesso cliente</h3>

          {/* Istruzioni semplificate */}
          <div style={{
            background: 'rgba(255,184,48,0.08)',
            border: '1px solid rgba(255,184,48,0.2)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
            fontSize: '13px',
            color: 'var(--warn)'
          }}>
            <strong>⚠️ Nota:</strong> Per creare utenti, segui questi 2 passi:<br />
            1. Vai su <strong>Supabase → Authentication → Users → Add user</strong> e inserisci email + password<br />
            2. Torna qui e usa il form sotto per collegare quell'utente al cliente
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label>Email utente *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" required />
              </div>
              <div className="form-group">
                <label>Password temporanea *</label>
                <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 caratteri" required minLength={6} />
              </div>
              <div className="form-group">
                <label>Nome completo / Azienda</label>
                <input value={form.nome_completo} onChange={e => setForm({ ...form, nome_completo: e.target.value })} placeholder="Es. Mario Rossi" />
              </div>
              <div className="form-group">
                <label>Assegna a cliente *</label>
                <select value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })} required>
                  <option value="">Seleziona cliente...</option>
                  {clienti.map(c => <option key={c.id} value={c.id}>{c.ragione_sociale}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creazione...' : '✓ Crea utente'}</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Annulla</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: '16px', fontSize: '16px' }}>Utenti attivi ({utenti.length})</h3>
        {utenti.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>👥</div>
            <p>Nessun utente cliente ancora. Creane uno per iniziare.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {utenti.map(u => (
              <div key={u.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                background: 'var(--bg3)',
                borderRadius: '10px',
                border: '1px solid var(--border)'
              }}>
                <div style={{
                  width: '38px', height: '38px',
                  background: 'linear-gradient(135deg, var(--accent2), var(--accent))',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px', flexShrink: 0
                }}>
                  {u.nome_completo?.charAt(0) || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{u.nome_completo || 'Utente senza nome'}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text2)' }}>
                    🏢 {u.clienti?.ragione_sociale || 'Cliente non assegnato'}
                  </div>
                </div>
                <span className="badge badge-green">Attivo</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
