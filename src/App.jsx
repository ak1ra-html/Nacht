import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isConfigured } from './lib/supabase.js'
import ScriptCard from './components/ScriptCard.jsx'
import ScriptModal from './components/ScriptModal.jsx'
import UpcomingCard from './components/UpcomingCard.jsx'
import RequestModal from './components/RequestModal.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import SocialLinks from './components/SocialLinks.jsx'

export default function App() {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [openId, setOpenId] = useState(null)
  const [showRequest, setShowRequest] = useState(false)

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

  // Keamanan: sesi admin tidak pernah dipulihkan. Setiap halaman dibuka/di-refresh,
  // sesi lama yang tersisa di browser dihapus, jadi login harus diulang.
  useEffect(() => {
    if (isConfigured) supabase.auth.signOut()
  }, [])

  function onLogoTap() {
    const t = taps.current
    t.count += 1
    clearTimeout(t.timer)
    t.timer = setTimeout(() => (t.count = 0), 2000)
    if (t.count >= 5) {
      t.count = 0
      if (!showPanel) setShowLogin(true)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    setIsAdmin(false)
    setShowPanel(false)
  }

  function handleDownload(variant) {
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

  const published = filtered.filter((s) => s.status !== 'upcoming')
  const upcoming = filtered.filter((s) => s.status === 'upcoming')
  const openScript = scripts.find((s) => s.id === openId)

  return (
    <div className="app">
      <header className="top">
        <div className="logo" onClick={onLogoTap} role="img" aria-label="NachtVML">
          <img className="logo-img" src="/logo.png" alt="" draggable="false" />
          <span className="logo-text">Nacht<b>VML</b></span>
        </div>
        <div className="top-actions">
          <input
            className="search"
            type="search"
            placeholder="Cari script atau replace..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isConfigured && (
            <button className="btn btn-request" onClick={() => setShowRequest(true)}>
              Request Script
            </button>
          )}
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>Script skin ML, siap download.</h1>
          <p>Setiap script punya preview dan pilihan replace. Yang gratis dan yang berbayar ditandai jelas.</p>
        </div>
        <div className="hero-art" aria-hidden="true">
          <img className="art art-angry" src="/art/angry.webp" alt="" draggable="false" />
          <img className="art art-sitting" src="/art/sitting.webp" alt="" draggable="false" />
          <img className="art art-halo" src="/art/halo.webp" alt="" draggable="false" />
          <img className="art art-flying" src="/art/flying.webp" alt="" draggable="false" />
        </div>
      </section>

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
          onClose={logout}
          onLogout={logout}
        />
      )}

      <main>
        {loading && <p className="muted center">Memuat...</p>}
        {loadError && <p className="error center">Gagal memuat data: {loadError}</p>}
        {!loading && !loadError && filtered.length === 0 && (
          <div className="empty">
            <img src="/art/inkwell.webp" alt="" draggable="false" />
            <p className="muted">{query ? 'Tidak ada hasil.' : 'Belum ada script.'}</p>
          </div>
        )}
        {published.length > 0 && (
          <div className="grid">
            {published.map((item) => (
              <ScriptCard key={item.id} item={item} onOpen={(s) => setOpenId(s.id)} />
            ))}
          </div>
        )}

        {upcoming.length > 0 && (
          <section className="upcoming">
            <h2 className="section-title">
              <img src="/art/crossed.webp" alt="" draggable="false" />
              Segera hadir
            </h2>
            <div className="grid">
              {upcoming.map((item) => (
                <UpcomingCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="foot">
        <img className="foot-swirl" src="/art/swirl.webp" alt="" draggable="false" />
        <div className="foot-main">
          <p className="foot-title">Ikuti NachtVML untuk update script terbaru</p>
          <SocialLinks variant="full" />
          <p className="foot-credit">NachtVML. Ilustrasi oleh @ogipiyo.</p>
        </div>
        <img className="foot-apple" src="/art/apple.webp" alt="" draggable="false" />
      </footer>

      {openScript && (
        <ScriptModal
          script={openScript}
          onClose={() => setOpenId(null)}
          onDownload={handleDownload}
        />
      )}

      {showRequest && <RequestModal onClose={() => setShowRequest(false)} />}

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
