export interface TeamMember {
  id: string
  name: string
  street: string
  houseNumber: string
  postcode: string
  city: string
  role: string
  team: string
  category: string
  lat?: number
  lng?: number
  geocoded: boolean
}

export interface GeoCache {
  postcode: string
  lat: number
  lng: number
  cached_at: number
}

export interface GeocodeResult {
  lat: number
  lng: number
  fromCache: boolean
}

export interface GeocodingStats {
  total: number
  fromCache: number
  newLookups: number
  failed: number
}

export interface TeamInfo {
  name: string
  color: string
  count: number
  visible: boolean
}

export interface AppStats {
  totalPersons: number
  placedOnMap: number
  teamCount: number
  cacheHits: number
  cacheMisses: number
}
