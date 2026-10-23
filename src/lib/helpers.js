import { supabase } from './supabase.js'

// Tambahkan https:// otomatis kalau link diketik tanpa awalan.
export function normalizeUrl(value) {
  const v = value.trim()
  if (!v) return v
  return /^[a-z][a-z0-9+.-]*:/i.test(v) ? v : `https://${v}`
}

// Perkecil gambar besar (mis. wallpaper 4K) sebelum diupload, supaya semua gambar bisa dipakai.
async function prepareImage(file) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.85))
    return blob ? new File([blob], 'thumb.webp', { type: 'image/webp' }) : file
  } catch {
    return file
  }
}

// Upload gambar ke Supabase Storage dan kembalikan URL publiknya.
export async function uploadImage(raw) {
  const file = await prepareImage(raw)
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage
    .from('thumbnails')
    .upload(path, file, { cacheControl: '31536000', contentType: file.type })
  if (error) throw error
  return supabase.storage.from('thumbnails').getPublicUrl(path).data.publicUrl
}

// Ambil ID video dari link YouTube (watch, youtu.be, shorts, embed, live). Kembalikan null kalau bukan YouTube.
export function getYouTubeId(value) {
  if (!value) return null
  try {
    const u = new URL(normalizeUrl(value))
    const host = u.hostname.replace(/^(www\.|m\.|music\.)/, '')
    let id = null
    if (host === 'youtu.be') {
      id = u.pathname.slice(1).split('/')[0]
    } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      if (u.pathname === '/watch') id = u.searchParams.get('v')
      else {
        const m = u.pathname.match(/^\/(?:embed|shorts|live|v)\/([^/?#]+)/)
        if (m) id = m[1]
      }
    }
    return id && /^[\w-]{11}$/.test(id) ? id : null
  } catch {
    return null
  }
}
