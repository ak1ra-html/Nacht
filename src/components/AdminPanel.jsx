import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { uploadImage, normalizeUrl, getYouTubeId } from '../lib/helpers.js'
import VariantManager from './VariantManager.jsx'
import RequestsManager from './RequestsManager.jsx'

const EMPTY = { title: '', description: '', youtube_url: '', thumbnail_url: '', status: 'published', release_note: '' }

export default function AdminPanel({ scripts, onChanged, onClose, onLogout }) {
  const [tab, setTab] = useState('scripts')
  const [newRequests, setNewRequests] = useState(0)

  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [managingId, setManagingId] = useState(null)
  const [file, setFile] = useState(null)
  const [inputKey, setInputKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const managing = scripts.find((s) => s.id === managingId)
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Jumlah request baru untuk badge pada tab.
  useEffect(() => {
    supabase
      .from('script_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new')
      .then(({ count }) => setNewRequests(count || 0))
  }, [])

  function reset() {
    setForm(EMPTY)
    setEditingId(null)
    setFile(null)
    setInputKey((k) => k + 1)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setFile(null)
    setInputKey((k) => k + 1)
    setError('')
    setMessage('')
    setForm({
      title: item.title || '',
      description: item.description || '',
      youtube_url: item.youtube_url || '',
      thumbnail_url: item.thumbnail_url || '',
      status: item.status || 'published',
      release_note: item.release_note || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!file && !form.thumbnail_url) {
      setError('Pilih gambar thumbnail dulu.')
      return
    }

    const ytRaw = form.youtube_url.trim()
    if (ytRaw && !getYouTubeId(ytRaw)) {
      setError('Link YouTube tidak valid. Contoh: https://youtu.be/xxxxxxxxxxx')
      return
    }

    setBusy(true)
    try {
      let thumbnail_url = form.thumbnail_url || null
      if (file) thumbnail_url = await uploadImage(file)

      const upcoming = form.status === 'upcoming'
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        youtube_url: ytRaw ? normalizeUrl(ytRaw) : null,
        thumbnail_url,
        status: form.status,
        release_note: upcoming ? form.release_note.trim() || null : null,
      }

      if (editingId) {
        const { error: dbError } = await supabase.from('scripts').update(payload).eq('id', editingId)
        if (dbError) throw dbError
        setMessage('Script diperbarui.')
        reset()
        await onChanged()
      } else {
        const { data, error: dbError } = await supabase.from('scripts').insert(payload).select().single()
        if (dbError) throw dbError
        reset()
        await onChanged()
        if (upcoming) {
          setMessage('Script upcoming ditambahkan. Kalau sudah rilis, tekan tombol "Rilis" pada daftar.')
        } else {
          setManagingId(data.id)
          setMessage('Script ditambahkan. Sekarang tambahkan replace-nya di bawah.')
        }
      }
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  // Ubah upcoming menjadi script yang sudah rilis, lalu langsung isi replace-nya.
  async function release(item) {
    const { error: dbError } = await supabase
      .from('scripts')
      .update({ status: 'published', release_note: null })
      .eq('id', item.id)
    if (dbError) {
      setError(dbError.message)
      return
    }
    setError('')
    await onChanged()
    setManagingId(item.id)
    setMessage(`"${item.title}" sudah dirilis. Tambahkan replace-nya di bawah.`)
  }

  async function remove(item) {
    if (!window.confirm(`Hapus "${item.title}" beserta semua replace-nya?`)) return
    const { error: dbError } = await supabase.from('scripts').delete().eq('id', item.id)
    if (dbError) {
      setError(dbError.message)
      return
    }
    if (editingId === item.id) reset()
    if (managingId === item.id) setManagingId(null)
    setError('')
    setMessage('Script dihapus.')
    await onChanged()
  }

  return (
    <section className="admin">
      <div className="admin-head">
        <h2>Panel Admin</h2>
        <div className="row">
          <button className="btn" onClick={onClose}>Tutup</button>
          <button className="btn" onClick={onLogout}>Keluar</button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab ${tab === 'scripts' ? 'tab-on' : ''}`} onClick={() => setTab('scripts')}>
          Script
        </button>
        <button className={`tab ${tab === 'requests' ? 'tab-on' : ''}`} onClick={() => setTab('requests')}>
          Request{newRequests > 0 && <span className="dot">{newRequests}</span>}
        </button>
      </div>

      {tab === 'requests' && <RequestsManager onCount={setNewRequests} />}

      {tab === 'scripts' && (
        <>
          <form className="admin-form" onSubmit={submit}>
            <h3>{editingId ? 'Edit script' : 'Tambah script baru'}</h3>

            <div className="grid2">
              <label>
                Judul script
                <input value={form.title} onChange={set('title')} placeholder="Fanny Legend" required />
              </label>
              <label>
                Status
                <select value={form.status} onChange={set('status')}>
                  <option value="published">Sudah rilis</option>
                  <option value="upcoming">Upcoming (segera hadir)</option>
                </select>
              </label>
            </div>

            {form.status === 'upcoming' && (
              <label>
                Keterangan rilis (opsional)
                <input
                  value={form.release_note}
                  onChange={set('release_note')}
                  maxLength={60}
                  placeholder="Contoh: Rilis minggu depan"
                />
              </label>
            )}

            <label>
              Deskripsi (opsional)
              <textarea
                className="desc-input"
                rows="5"
                value={form.description}
                onChange={set('description')}
                placeholder={'Tulis deskripsi. Tekan Enter untuk baris baru,\nkosongkan satu baris untuk jarak antar paragraf.'}
              />
            </label>

            <label>
              Link video YouTube (opsional)
              <input
                type="url"
                value={form.youtube_url}
                onChange={set('youtube_url')}
                placeholder="https://youtu.be/xxxxxxxxxxx"
              />
              {form.youtube_url.trim() && !getYouTubeId(form.youtube_url) && (
                <span className="error">Link belum dikenali sebagai video YouTube.</span>
              )}
            </label>

            <label>
              {editingId ? 'Ganti thumbnail (opsional)' : 'Upload thumbnail'}
              <input key={inputKey} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            {editingId && form.thumbnail_url && !file && (
              <img className="thumb-preview" src={form.thumbnail_url} alt="Thumbnail saat ini" />
            )}

            {error && <p className="error">{error}</p>}
            {message && <p className="ok">{message}</p>}

            <div className="row">
              {editingId && <button type="button" className="btn" onClick={reset}>Batal edit</button>}
              <button className="btn btn-primary" disabled={busy}>
                {busy ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah script'}
              </button>
            </div>
          </form>

          {managing && (
            <VariantManager
              key={managing.id}
              script={managing}
              onChanged={onChanged}
              onClose={() => setManagingId(null)}
            />
          )}

          <div className="admin-list">
            {scripts.map((item) => {
              const upcoming = item.status === 'upcoming'
              return (
                <div className="admin-item" key={item.id}>
                  {item.thumbnail_url ? <img src={item.thumbnail_url} alt="" /> : <div className="mini-empty" />}
                  <div className="admin-item-text">
                    <strong>{item.title}</strong>
                    <span>
                      {upcoming ? 'Upcoming' : `${(item.script_variants || []).length} replace`}
                      {upcoming && item.release_note ? ` • ${item.release_note}` : ''}
                    </span>
                  </div>
                  <div className="row">
                    {upcoming ? (
                      <button className="btn btn-primary" onClick={() => release(item)}>Rilis</button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => {
                          setManagingId(item.id)
                          setMessage('')
                        }}
                      >
                        Replace
                      </button>
                    )}
                    <button className="btn" onClick={() => startEdit(item)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => remove(item)}>Hapus</button>
                  </div>
                </div>
              )
            })}
            {scripts.length === 0 && <p className="muted">Belum ada script.</p>}
          </div>
        </>
      )}
    </section>
  )
}
