const configuredBaseUrl = import.meta.env.VITE_API_URL?.trim() || ''

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '')

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export function assetUrl(path) {
  if (!path || /^(?:https?:)?\/\//.test(path) || path.startsWith('data:')) return path
  return apiUrl(path)
}

export function s3AssetUrl(path) {
  if (typeof path !== 'string' || !path.trim()) return ''
  let pathname = path.trim()
  try {
    pathname = new URL(pathname, 'http://localhost').pathname
  } catch {
    return ''
  }
  const uploadsIndex = pathname.indexOf('/uploads/')
  if (uploadsIndex >= 0) return apiUrl(pathname.slice(uploadsIndex))
  const keyIndex = pathname.indexOf('Product_images/')
  return keyIndex >= 0 ? apiUrl(`/uploads/${pathname.slice(keyIndex)}`) : ''
}
