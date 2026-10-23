import { useState } from 'react'

// Menampilkan thumbnail dulu; iframe YouTube baru dimuat saat diklik supaya halaman tetap ringan.
export default function YouTubePreview({ videoId, title }) {
  const [playing, setPlaying] = useState(false)

  return (
    <div className="yt">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={`Preview ${title}`}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button type="button" className="yt-facade" onClick={() => setPlaying(true)} aria-label={`Putar preview ${title}`}>
          <img src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`} alt="" loading="lazy" />
          <span className="yt-play" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
          </span>
          <span className="yt-label">Preview video</span>
        </button>
      )}
    </div>
  )
}
