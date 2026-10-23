import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function AdminLogin({ onSuccess, onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setBusy(false)
      setError('Email atau password salah.')
      return
    }

    // Pastikan akun ini benar-benar terdaftar sebagai admin.
    const { data: ok } = await supabase.rpc('is_admin')
    if (!ok) {
      await supabase.auth.signOut()
      setBusy(false)
      setError('Akun ini bukan admin.')
      return
    }

    setBusy(false)
    onSuccess()
  }

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>Masuk Admin</h2>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button type="button" className="btn" onClick={onClose}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Memeriksa...' : 'Masuk'}
          </button>
        </div>
      </form>
    </div>
  )
}
