import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const COOLDOWN_MS = 60 * 1000
const KEY = 'nacht:lastRequestAt'

function lastSent() {
  try {
    return Number(localStorage.getItem(KEY)) || 0
  } catch {
    return 0
  }
}

export default function RequestModal({ onClose }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [text, setText] = useState('')
  const [trap, setTrap] = useState('') // honeypot: manusia tidak mengisinya
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function submit(e) {
    e.preventDefault()
    setError('')

    const body = text.trim()
    if (body.length < 5) {
      setError('Tulis request kamu minimal 5 huruf.')
      return
    }

    // Bot mengisi kolom tersembunyi: pura-pura sukses tanpa mengirim apa pun.
    if (trap) {
      setDone(true)
      return
    }

    const wait = COOLDOWN_MS - (Date.now() - lastSent())
    if (wait > 0) {
      setError(`Tunggu ${Math.ceil(wait / 1000)} detik sebelum mengirim request lagi.`)
      return
    }

    setBusy(true)
    const { error: dbError } = await supabase.from('script_requests').insert({
      requester_name: name.trim() || null,
      contact: contact.trim() || null,
      request_text: body,
    })
    setBusy(false)

    if (dbError) {
      setError('Gagal mengirim request. Coba lagi sebentar lagi.')
      return
    }
    try {
      localStorage.setItem(KEY, String(Date.now()))
    } catch {
      /* abaikan: penyimpanan browser tidak tersedia */
    }
    setDone(true)
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal modal-wide" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        {done ? (
          <>
            <h2>Request terkirim</h2>
            <p className="muted">Terima kasih! Request kamu sudah masuk dan akan dicek oleh admin.</p>
            <div className="row">
              <button type="button" className="btn btn-primary" onClick={onClose}>Tutup</button>
            </div>
          </>
        ) : (
          <>
            <h2>Request Script</h2>
            <p className="muted small">Mau script apa? Tulis hero, skin, dan replace yang kamu cari.</p>

            <label>
              Request kamu
              <textarea
                rows="4"
                maxLength={500}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Contoh: Script Kagura Legend replace Elite"
                required
                autoFocus
              />
              <span className="counter">{text.length}/500</span>
            </label>

            <div className="grid2">
              <label>
                Nama (opsional)
                <input maxLength={60} value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label>
                Kontak (opsional)
                <input
                  maxLength={100}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="WhatsApp / IG / Discord"
                />
              </label>
            </div>

            {/* honeypot */}
            <input
              className="trap"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={trap}
              onChange={(e) => setTrap(e.target.value)}
              name="website"
            />

            {error && <p className="error">{error}</p>}

            <div className="row">
              <button type="button" className="btn" onClick={onClose}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={busy}>
                {busy ? 'Mengirim...' : 'Kirim request'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}
