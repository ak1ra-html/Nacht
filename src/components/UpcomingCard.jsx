export default function UpcomingCard({ item }) {
  return (
    <article className="card card-upcoming">
      <div className="card-thumb">
        {item.thumbnail_url ? (
          <img src={item.thumbnail_url} alt={item.title} loading="lazy" />
        ) : (
          <div className="thumb-empty">Tanpa gambar</div>
        )}
        <span className="badge badge-soon">Segera hadir</span>
      </div>

      <div className="card-body">
        <h3>{item.title}</h3>
        {item.description && <p className="desc">{item.description}</p>}
        <div className="card-foot">
          {item.release_note ? <span className="chip chip-soon">{item.release_note}</span> : <span />}
          <span className="count">Belum rilis</span>
        </div>
      </div>
    </article>
  )
}
