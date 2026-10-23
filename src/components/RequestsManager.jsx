import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const LABEL = { new: 'Baru', processing: 'Diproses', done: 'Selesai' }
const NEXT = { new: 'processing', processing: 'done', done: 'new' }

function fmt(iso) {
  try {
    return new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}

export default function RequestsManager({ onCount }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('open')

  const load = useCallback(async () => {
    const { data, error: dbError } = await supabase
      .from('script_requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (dbError) setError(dbError.message)
    else {
      setError('')
      setRows(data)
      onCount?.(data.filter((r) => r.status === 'new').length)
    }
    setLoading(false)
  }, [onCount])

  useEffect(() => {
    load()
  }, [load])

  async function cycle(row) {
    const { error: dbError } = await supabase
      .from('script_requests')
      .update({ status: NEXT[row.status] })
      .eq('id', row.id)
    if (dbError) setError(dbError.message)
    else load()
  }

  async function remove(row) {
    if (!window.confirm('Hapus request ini?')) return
    const { error: dbError } = await supabase.from('script_requests').delete().eq('id', row.id)
    if (dbError) setError(dbError.message)
    else load()
  }

  const shown = rows.filter((r) => (filter === 'open' ? r.status !== 'done' : filter === 'done' ? r.status === 'done' : true))

  return (
    <div className="variants-box">
      <div className="admin-head">
        <h3>Request masuk</h3>
        <div className="row">
          {[
            ['open', 'Belum selesai'],
            ['done', 'Selesai'],
            ['all', 'Semua'],
          ].map(([key, label]) => (
            <button key={key} className={`btn ${filter === key ? 'btn-primary' : ''}`} onClick={() => setFilter(key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading && <p className="muted">Memuat...</p>}

      <div className="admin-list">
        {shown.map((r) => (
          <div className={`req req-${r.status}`} key={r.id}>
            <div className="req-main">
              <p className="req-text">{r.request_text}</p>
              <span className="req-meta">
                {r.requester_name || 'Anonim'}
                {r.contact ? ` • ${r.contact}` : ''} • {fmt(r.created_at)}
              </span>
            </div>
            <div className="row">
              <button className="btn" onClick={() => cycle(r)} title="Ubah status">
                {LABEL[r.status]}
              </button>
              <button className="btn btn-danger" onClick={() => remove(r)}>Hapus</button>
            </div>
          </div>
        ))}
        {!loading && shown.length === 0 && <p className="muted">Tidak ada request.</p>}
      </div>
    </div>
  )
}
