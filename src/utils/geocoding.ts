import type { GeoCache, GeocodeResult } from '../types'

const CACHE_PREFIX = 'geocache_'
const RATE_LIMIT_MS = 1100

function getCacheKey(postcode: string): string {
  return `${CACHE_PREFIX}${postcode.replace(/\s/g, '').toUpperCase()}`
}

function readCache(postcode: string): GeoCache | null {
  try {
    const key = getCacheKey(postcode)
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as GeoCache
  } catch {
    return null
  }
}

function writeCache(postcode: string, lat: number, lng: number): void {
  try {
    const key = getCacheKey(postcode)
    const entry: GeoCache = {
      postcode: postcode.replace(/\s/g, '').toUpperCase(),
      lat,
      lng,
      cached_at: Date.now(),
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

async function fetchGeocode(postcode: string, city: string): Promise<{ lat: number; lng: number } | null> {
  const query = encodeURIComponent(`${postcode}, ${city}, Netherlands`)
  const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=nl`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TeamKaart-MoveBeyond/1.0',
        'Accept-Language': 'nl',
      },
    })
    if (!response.ok) return null
    const data = await response.json() as Array<{ lat: string; lon: string }>
    if (!data || data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

let lastRequestTime = 0

export async function geocodePostcode(
  postcode: string,
  city: string
): Promise<GeocodeResult | null> {
  const cached = readCache(postcode)
  if (cached) {
    return { lat: cached.lat, lng: cached.lng, fromCache: true }
  }

  // Rate limiting: wait if needed
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed))
  }
  lastRequestTime = Date.now()

  const result = await fetchGeocode(postcode, city)
  if (!result) return null

  writeCache(postcode, result.lat, result.lng)
  return { lat: result.lat, lng: result.lng, fromCache: false }
}

export function clearGeocodeCache(): void {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      keys.push(key)
    }
  }
  keys.forEach((key) => localStorage.removeItem(key))
}

export function getCacheSize(): number {
  let count = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) count++
  }
  return count
}
