import { useEffect, useState } from 'react'

// Pratinjau gambar: menampilkan file yang baru dipilih, atau gambar yang sudah tersimpan.
export default function FilePreview({ file, current, alt }) {
  const [url, setUrl] = useState(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const u = URL.createObjectURL(file)
    setUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [file])

  const src = url || current
  if (!src) return null

  return (
    <div className="preview-box">
      <img className="thumb-preview" src={src} alt={alt} />
      <span className="preview-label">{url ? 'Pratinjau gambar baru' : 'Gambar saat ini'}</span>
    </div>
  )
}
