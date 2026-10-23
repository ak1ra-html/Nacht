import { useState } from 'react'
import { supabase, safeUrl } from '../lib/supabase.js'
import { normalizeUrl, uploadImage } from '../lib/helpers.js'

const EMPTY = { replace_name: '', download_url: '', thumbnail_url: '', is_free: true }

export default function VariantManager({ script, onChanged, onClose }) {
  const variants = script.script_variants || []
  const [form, setForm] = useState(EMPTY)
  const [editingId, setEditingId] = useState(null)
  const [file, setFile] = useState(null)
  const [inputKey, setInputKey] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  function reset() {
    setForm(EMPTY)
    setEditingId(null)
    setFile(null)
    setInputKey((k) => k + 1)
  }

  function startEdit(v) {
    setEditingId(v.id)
    setFile(null)
    setInputKey((k) => k + 1)
    setError('')
    setMessage('')
    setForm({
      replace_name: v.replace_name || '',
      download_url: v.download_url || '',
      thumbnail_url: v.thumbnail_url || '',
      is_free: v.is_free !== false,
    })
  }

  async function submit(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    const downloadUrl = safeUrl(normalizeUrl(form.download_url))
    if (!downloadUrl) {
      setError(form.is_free ? 'Link download tidak valid.' : 'Link beli tidak valid.')
      return
    }

    setBusy(true)
    try {
      let thumbnail_url = form.thumbnail_url || null
      if (file) thumbnail_url = await uploadImage(file)

      const payload = {
        replace_name: form.replace_name.trim(),
        download_url: downloadUrl,
        thumbnail_url,
        is_free: form.is_free,
      }

      const query = editingId
        ? supabase.from('script_variants').update(payload).eq('id', editingId)
        : supabase.from('script_variants').insert({ ...payload, script_id: script.id })
      const { error: dbError } = await query
      if (dbError) throw dbError

      setMessage(editingId ? 'Replace diperbarui.' : 'Replace ditambahkan.')
      reset()
      await onChanged()
    } catch (err) {
      setError(err.message || 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
  }

  async function remove(v) {
    if (!window.confirm(`Hapus replace "${v.replace_name}"?`)) return
    const { error: dbError } = await supabase.from('script_variants').delete().eq('id', v.id)
    if (dbError) {
      setError(dbError.message)
      return
    }
    if (editingId === v.id) reset()
    setError('')
    setMessage('Replace dihapus.')
    await onChanged()
  }

  return (
    <div className="variants-box">
      <div className="admin-head">
        <h3>Replace untuk "{script.title}"</h3>
        <button className="btn" onClick={onClose}>Selesai</button>
      </div>

      <form className="admin-form" onSubmit={submit}>
        <h4>{editingId ? 'Edit replace' : 'Tambah replace'}</h4>

        <div className="grid2">
          <label>
            Nama replace
            <input value={form.replace_name} onChange={set('replace_name')} placeholder="Elite" required />
          </label>
          <label>
            Jenis
            <select
              value={form.is_free ? 'free' : 'paid'}
              onChange={(e) => setForm((f) => ({ ...f, is_free: e.target.value === 'free' }))}
            >
              <option value="free">Gratis (tombol Download)</option>
              <option value="paid">Berbayar (tombol Buy)</option>
            </select>
          </label>
        </div>

        <label>
          {form.is_free ? 'Link download' : 'Link beli (mis. chat WhatsApp)'}
          <input
            value={form.download_url}
            onChange={set('download_url')}
            placeholder={form.is_free ? 'mediafire.com/...' : 'wa.me/628xxxxxxxxxx'}
            required
          />
        </label>

        <label>
          {editingId ? 'Ganti gambar skin (opsional)' : 'Gambar skin replace (opsional)'}
          <input key={inputKey} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </label>
        {editingId && form.thumbnail_url && !file && (
          <img className="thumb-preview" src={form.thumbnail_url} alt="Gambar saat ini" />
        )}

        {error && <p className="error">{error}</p>}
        {message && <p className="ok">{message}</p>}

        <div className="row">
          {editingId && (
            <button type="button" className="btn" onClick={reset}>Batal edit</button>
          )}
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Menyimpan...' : editingId ? 'Simpan perubahan' : 'Tambah replace'}
          </button>
        </div>
      </form>

      <div className="admin-list">
        {variants.map((v) => (
          <div className="admin-item" key={v.id}>
            {v.thumbnail_url ? <img src={v.thumbnail_url} alt="" /> : <div className="mini-empty" />}
            <div className="admin-item-text">
              <strong>Replace {v.replace_name}</strong>
              <span>{v.is_free !== false ? 'Gratis' : 'Berbayar'}</span>
            </div>
            <div className="row">
              <button className="btn" onClick={() => startEdit(v)}>Edit</button>
              <button className="btn btn-danger" onClick={() => remove(v)}>Hapus</button>
            </div>
          </div>
        ))}
        {variants.length === 0 && <p className="muted">Belum ada replace. Tambahkan di atas.</p>}
      </div>
    </div>
  )
}
