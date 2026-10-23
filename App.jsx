import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase.js'
import ScriptCard from './components/ScriptCard.jsx'
import ScriptModal from './components/ScriptModal.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import AdminPanel from './components/AdminPanel.jsx'

export default function App() {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)

  const [isAdmin, setIsAdmin] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  // Tombol rahasia: ketuk logo 5x dalam 2 detik.
  const taps = useRef({ count: 0, timer: null })

  const load = useCallback(async () => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    const { data, error } = await supabase
      .from('scripts')
      .select('*, script_variants(*)')
      .order('created_at', { ascending: false })
    if (error) {
      setLoadError(error.message)
    } else {
      setLoadError('')
      setScripts(
        data.map((s) => ({
          ...s,
          script_variants: [...(s.script_variants || [])].sort(
            (a, b) => new Date(a.created_at) - new Date(b.created_at)
          ),
        }))
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Pulihkan sesi admin jika sebelumnya sudah login.
  useEffect(() => {
    if (!isConfigured) return
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: ok } = await supabase.rpc('is_admin')
      if (ok) setIsAdmin(true)
    })
  }, [])

  function onLogoTap() {
    const t = taps.current
    t.count += 1
    clearTimeout(t.timer)
    t.timer = setTimeout(() => (t.count = 0), 2000)
    if (t.count >= 5) {
      t.count = 0
      if (isAdmin) setShowPanel(true)
      else setShowLogin(true)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setIsAdmin(false)
    setShowPanel(false)
  }

  function handleDownload(variant) {
    setScripts((list) =>
      list.map((s) => ({
        ...s,
        script_variants: s.script_variants.map((v) =>
          v.id === variant.id ? { ...v, downloads: (v.downloads ?? 0) + 1 } : v
        ),
      }))
    )
    // Query Supabase baru dikirim saat .then() dipanggil, jadi wajib ada.
    supabase.rpc('increment_variant_downloads', { variant_id: variant.id }).then(({ error }) => {
      if (error) console.error('Gagal mencatat download:', error.message)
    })
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return scripts
    return scripts.filter((s) => {
      const names = (s.script_variants || []).map((v) => v.replace_name).join(' ')
      return `${s.title} ${names}`.toLowerCase().includes(q)
    })
  }, [scripts, query])

  const openScript = scripts.find((s) => s.id === openId)

  return (
    <div className="app">
      <header className="top">
        <div className="logo" onClick={onLogoTap} role="img" aria-label="NachtVML">
          <img className="logo-img" src="/logo.png" alt="" draggable="false" />
          <span className="logo-text">Nacht<b>VML</b></span>
        </div>
        <input
          className="search"
          type="search"
          placeholder="Cari script atau replace..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </header>

      {!isConfigured && (
        <div className="notice">
          Supabase belum dikonfigurasi. Isi <code>VITE_SUPABASE_URL</code> dan{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> (lihat README).
        </div>
      )}

      {isAdmin && showPanel && (
        <AdminPanel
          scripts={scripts}
          onChanged={load}
          onClose={() => setShowPanel(false)}
          onLogout={logout}
        />
      )}

      <main>
        {loading && <p className="muted center">Memuat...</p>}
        {loadError && <p className="error center">Gagal memuat data: {loadError}</p>}
        {!loading && !loadError && filtered.length === 0 && (
          <p className="muted center">{query ? 'Tidak ada hasil.' : 'Belum ada script.'}</p>
        )}
        <div className="grid">
          {filtered.map((item) => (
            <ScriptCard key={item.id} item={item} onOpen={(s) => setOpenId(s.id)} />
          ))}
        </div>
      </main>

      <footer className="foot">
        <p>NachtVML. Gunakan dengan risiko sendiri.</p>
      </footer>

      {openScript && (
        <ScriptModal
          script={openScript}
          onClose={() => setOpenId(null)}
          onDownload={handleDownload}
        />
      )}

      {showLogin && (
        <AdminLogin
          onClose={() => setShowLogin(false)}
          onSuccess={() => {
            setShowLogin(false)
            setIsAdmin(true)
            setShowPanel(true)
          }}
        />
      )}
    </div>
  )
}
