import type { Artist, DiscoveryEdge, Concert, GraphResponse } from './types'

// Set VITE_API_URL in your .env to point at your backend.
// For local dev, either set it to http://localhost:8080 (with CORS enabled on Spring Boot)
// or configure a Vite proxy in vite.config.ts to forward /api → http://localhost:8080
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status} ${text}`)
  }
  if (res.status === 204 || res.headers.get('content-length') === '0') {
    return undefined as T
  }
  return res.json() as Promise<T>
}

// ── Graph ─────────────────────────────────────────────────────────────────────

export const fetchGraph = (): Promise<GraphResponse> =>
  req('/api/graph')

// ── Artists ───────────────────────────────────────────────────────────────────

export const fetchArtists = (): Promise<Artist[]> =>
  req('/api/artists')

export const createArtist = (body: { name: string; imageUrl?: string | null }): Promise<Artist> =>
  req('/api/artists', { method: 'POST', body: JSON.stringify(body) })

export const updateArtist = (id: string, body: { name: string; imageUrl?: string | null }): Promise<Artist> =>
  req(`/api/artists/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteArtist = (id: string): Promise<void> =>
  req(`/api/artists/${id}`, { method: 'DELETE' })

// ── Discovery Edges ───────────────────────────────────────────────────────────

export const fetchEdges = (): Promise<DiscoveryEdge[]> =>
  req('/api/discovery-edges')

export interface CreateEdgeBody {
  fromArtistName?: string | null
  toArtistName: string
  connectorName?: string | null
  edgeType?: string | null
  notes?: string | null
}
export const createEdge = (body: CreateEdgeBody): Promise<DiscoveryEdge> =>
  req('/api/discovery-edges', { method: 'POST', body: JSON.stringify(body) })

export const deleteEdge = (id: string): Promise<void> =>
  req(`/api/discovery-edges/${id}`, { method: 'DELETE' })

// ── Concerts ──────────────────────────────────────────────────────────────────

export const fetchConcerts = (): Promise<Concert[]> =>
  req('/api/concerts')

export interface CreateConcertBody {
  artist: string
  venue: string
  city?: string | null
  state?: string | null
  showDate: string
  orderNumber?: string | null
  needsReview?: boolean
}
export const createConcert = (body: CreateConcertBody): Promise<Concert> =>
  req('/api/concerts', { method: 'POST', body: JSON.stringify(body) })

export const updateConcert = (id: string, body: CreateConcertBody): Promise<Concert> =>
  req(`/api/concerts/${id}`, { method: 'PUT', body: JSON.stringify(body) })

export const deleteConcert = (id: string): Promise<void> =>
  req(`/api/concerts/${id}`, { method: 'DELETE' })

// ── Import ────────────────────────────────────────────────────────────────────

export interface ImportResult {
  addedCount: number
  flaggedCount: number
  skippedCount: number
}
export const importMbox = async (file: File): Promise<ImportResult> => {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/api/import/mbox`, { method: 'POST', body: form })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`${res.status} ${text}`)
  }
  return res.json() as Promise<ImportResult>
}
