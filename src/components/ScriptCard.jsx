import { getYouTubeId } from '../lib/helpers.js'

export default function ScriptCard({ item, onOpen }) {
  const variants = item.script_variants || []
  const cover = item.thumbnail_url || variants.find((v) => v.thumbnail_url)?.thumbnail_url
  const shown = variants.slice(0, 3)

  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onOpen(item)
    }
  }

  return (
    <article className="card card-click" role="button" tabIndex={0} onClick={() => onOpen(item)} onKeyDown={onKey}>
      <div className="card-thumb">
        {cover ? <img src={cover} alt={item.title} loading="lazy" /> : <div className="thumb-empty">Tanpa gambar</div>}
        {getYouTubeId(item.youtube_url) && <span className="badge-video">▶ Preview</span>}
        <span className="badge">{variants.length ? `${variants.length} replace` : 'Belum ada replace'}</span>
      </div>

      <div className="card-body">
        <h3>{item.title}</h3>
        {item.description && <p className="desc">{item.description}</p>}

        {shown.length > 0 && (
          <div className="chips">
            {shown.map((v) => (
              <span className="chip" key={v.id}>{v.replace_name}</span>
            ))}
            {variants.length > shown.length && <span className="chip">+{variants.length - shown.length}</span>}
          </div>
        )}

        <div className="card-foot">
          <span className="btn btn-primary">Lihat replace</span>
        </div>
      </div>
    </article>
  )
}
