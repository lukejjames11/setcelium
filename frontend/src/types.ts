export interface Artist {
  id: string
  name: string
  imageUrl: string | null
}

export interface DiscoveryEdge {
  id: string
  fromArtist: Artist | null
  toArtist: Artist
  connectorName: string | null
  edgeType: string | null
  notes: string | null
}

export interface Concert {
  id: string
  artist: string
  venue: string
  city: string | null
  state: string | null
  showDate: string
  source: string
  orderNumber: string | null
  needsReview: boolean
}

export interface GraphNode {
  id: string
  name: string
  imageUrl: string | null
}

export interface GraphLink {
  source: string
  target: string
  connectorName: string | null
  edgeType: string | null
  notes: string | null
}

export interface GraphResponse {
  nodes: GraphNode[]
  links: GraphLink[]
}
