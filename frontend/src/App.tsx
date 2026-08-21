import { useState, useEffect, useCallback } from 'react'
import { Network, Music2, Upload, Plus, GitBranch, Loader2, AlertTriangle } from 'lucide-react'
import type { Artist, DiscoveryEdge, Concert, GraphResponse, GraphNode, GraphLink } from './types'
import {
  fetchGraph, fetchEdges, fetchConcerts,
  createArtist, updateArtist, deleteArtist,
  createEdge, deleteEdge,
  createConcert, updateConcert, deleteConcert,
  type CreateEdgeBody, type CreateConcertBody,
} from './api'
import { GraphCanvas } from './components/GraphCanvas'
import { ArtistPanel } from './components/ArtistPanel'
import { EdgePanel } from './components/EdgePanel'
import { AddDataSheet } from './components/AddDataSheet'
import { ConcertsView } from './components/ConcertsView'
import { ImportView } from './components/ImportView'

type View = 'graph' | 'concerts' | 'import'

export default function App() {
  const [view, setView] = useState<View>('graph')

  const [graph, setGraph] = useState<GraphResponse>({ nodes: [], links: [] })
  const [edges, setEdges] = useState<DiscoveryEdge[]>([])
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [loading, setLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null)
  const [selectedEdge, setSelectedEdge] = useState<DiscoveryEdge | null>(null)
  const [addOpen, setAddOpen] = useState(false)

  // ── Initial load ──────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    try {
      const [g, e, c] = await Promise.all([fetchGraph(), fetchEdges(), fetchConcerts()])
      setGraph(g); setEdges(e); setConcerts(c)
      setApiError(null)
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Could not reach API')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const reloadGraph = async () => {
    const [g, e] = await Promise.all([fetchGraph(), fetchEdges()])
    setGraph(g); setEdges(e)
  }

  // ── Artist handlers ───────────────────────────────────────────────────────────

  const handleAddArtist = async (data: { name: string; imageUrl: string | null }) => {
    await createArtist(data)
    await reloadGraph()
  }

  const handleEditArtist = async (updated: Artist) => {
    await updateArtist(updated.id, { name: updated.name, imageUrl: updated.imageUrl })
    setSelectedArtist(updated)
    await reloadGraph()
  }

  const handleDeleteArtist = async (id: string) => {
    await deleteArtist(id)
    setSelectedArtist(null)
    const [g, e, c] = await Promise.all([fetchGraph(), fetchEdges(), fetchConcerts()])
    setGraph(g); setEdges(e); setConcerts(c)
  }

  // ── Edge handlers ─────────────────────────────────────────────────────────────

  const handleAddEdge = async (data: CreateEdgeBody) => {
    await createEdge(data)
    await reloadGraph()
  }

  const handleDeleteEdge = async (id: string) => {
    await deleteEdge(id)
    if (selectedEdge?.id === id) setSelectedEdge(null)
    await reloadGraph()
  }

  // ── Concert handlers ──────────────────────────────────────────────────────────

  const handleAddConcert = async (data: CreateConcertBody) => {
    await createConcert(data)
    setConcerts(await fetchConcerts())
  }

  const handleEditConcert = async (updated: Concert) => {
  await updateConcert(updated.id, {
    artist: updated.artist,
    venue: updated.venue,
    city: updated.city,
    state: updated.state,
    showDate: updated.showDate,
  })
  setConcerts(prev => prev.map(c => c.id === updated.id ? updated : c))
  }

  const handleDeleteConcert = async (id: string) => {
    await deleteConcert(id)
    setConcerts(prev => prev.filter(c => c.id !== id))
  }

  // ── Navigation ────────────────────────────────────────────────────────────────

  const handleSelectNode = useCallback((node: GraphNode | null) => {
    if (!node) { setSelectedArtist(null); return }
    setSelectedArtist({ id: node.id, name: node.name, imageUrl: node.imageUrl })
    setSelectedEdge(null)
    if (view !== 'graph') setView('graph')
  }, [view])

  const handleSelectLink = useCallback((link: GraphLink | null) => {
    if (!link) { setSelectedEdge(null); return }
    const match = edges.find(e =>
      (e.fromArtist?.id === link.source && e.toArtist.id === link.target) ||
      (e.fromArtist?.id === link.target && e.toArtist.id === link.source)
    )
    setSelectedEdge(match ?? null)
    setSelectedArtist(null)
  }, [edges])

  const selectedLinkKey = selectedEdge
    ? `${selectedEdge.fromArtist?.id}→${selectedEdge.toArtist.id}`
    : null

  const navItems: { key: View; icon: typeof Network; label: string }[] = [
    { key: 'graph',    icon: Network, label: 'Graph'    },
    { key: 'concerts', icon: Music2,  label: 'Concerts' },
    { key: 'import',   icon: Upload,  label: 'Import'   },
  ]

  return (
    <div className="flex flex-col h-screen bg-[#09090f] overflow-hidden">
      {/* ── Nav ── */}
      <header className="flex items-center justify-between px-5 h-14 flex-shrink-0 border-b border-white/[0.06] bg-[#09090f]/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-2.5">
          <HexIcon />
          <span className="text-slate-100 select-none" style={{ fontSize: '15px', fontWeight: 500, letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
            setcelium
          </span>
        </div>

        <nav className="flex items-center">
          {navItems.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] transition-all mx-0.5 ${
                view === key
                  ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Stat label="artists" value={graph.nodes.length} />
            <Stat label="connections" value={graph.links.length} />
            <Stat label="concerts" value={concerts.length} />
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-white transition-all"
            style={{ background: 'rgba(99,102,241,0.8)', boxShadow: '0 0 14px rgba(99,102,241,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.8)' }}
          >
            <Plus size={13} />
            Add
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="flex flex-1 overflow-hidden">
        {view === 'graph' && (
          <>
            <div className="flex-1 relative overflow-hidden">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 size={24} className="text-indigo-500 animate-spin" />
                  <p className="text-slate-600 text-[12px]">Connecting to backend…</p>
                </div>
              ) : apiError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
                  <AlertTriangle size={24} className="text-amber-500" />
                  <p className="text-slate-400 text-[13px]">Could not reach the API</p>
                  <p className="text-slate-600 text-[11px] max-w-xs">{apiError}</p>
                  <p className="text-slate-700 text-[11px]">Set <code className="text-slate-600">VITE_API_URL</code> or configure a Vite proxy to <code className="text-slate-600">/api</code></p>
                  <button onClick={loadAll} className="mt-2 px-4 py-1.5 rounded-lg text-[12px] bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-colors">Retry</button>
                </div>
              ) : (
                <GraphCanvas
                  nodes={graph.nodes}
                  links={graph.links}
                  selectedNodeId={selectedArtist?.id ?? null}
                  selectedLinkKey={selectedLinkKey}
                  onSelectNode={handleSelectNode}
                  onSelectLink={handleSelectLink}
                />
              )}

              {!loading && !apiError && graph.nodes.length === 0 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <GitBranch size={32} className="text-slate-700 mb-3" />
                  <p className="text-slate-600 text-[13px]">No artists yet. Add one to get started.</p>
                </div>
              )}
            </div>

            {selectedArtist && (
              <ArtistPanel
                artist={selectedArtist}
                edges={edges}
                concerts={concerts}
                onClose={() => setSelectedArtist(null)}
                onSelectArtist={a => { setSelectedArtist(a); setSelectedEdge(null) }}
                onEditArtist={handleEditArtist}
                onDeleteArtist={handleDeleteArtist}
                onDeleteEdge={handleDeleteEdge}
              />
            )}

            {selectedEdge && (
              <EdgePanel
                edge={selectedEdge}
                onClose={() => setSelectedEdge(null)}
                onDeleteEdge={handleDeleteEdge}
                onSelectArtist={a => { setSelectedArtist(a); setSelectedEdge(null) }}
              />
            )}
          </>
        )}

        {view === 'concerts' && (
          <ConcertsView
            concerts={concerts}
            onDeleteConcert={handleDeleteConcert}
            onEditConcert={handleEditConcert}
          />
        )}

        {view === 'import' && <ImportView onImportComplete={loadAll} />}  
      </main>

      <AddDataSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAddArtist={handleAddArtist}
        onAddEdge={handleAddEdge}
        onAddConcert={handleAddConcert}
      />
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-slate-200" style={{ fontSize: '15px', fontWeight: 400 }}>{value}</span>
      <span className="text-[11px] text-slate-600">{label}</span>
    </div>
  )
}

function HexIcon() {
  const s = '#818cf8'
  const w1 = 1.35, w2 = 1.15, w3 = 0.95
  const op1 = 0.9, op2 = 0.72, op3 = 0.55
  return (
    <svg width="42" height="34" viewBox="0 0 58 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: 'drop-shadow(0 0 5px #818cf830)' }}>
      {/* ── Note heads ── */}
      <ellipse cx="13" cy="24" rx="6.2" ry="4" fill={s} transform="rotate(-32 13 24)" />
      <ellipse cx="38" cy="18" rx="6.2" ry="4" fill={s} transform="rotate(-32 38 18)" />

      {/* ── Stems ── */}
      <line x1="17.8" y1="22.5" x2="17.8" y2="8" stroke={s} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="42.8" y1="16.5" x2="42.8" y2="2" stroke={s} strokeWidth="2.5" strokeLinecap="round" />

      {/* ── Beam ── */}
      <path d="M 17.8 7 L 42.8 1 L 42.8 5.8 L 17.8 11.8 Z" fill={s} />

      {/* ══ Left note roots ══ */}
      {/* arm L1 — far left */}
      <path d="M 13 28 C 9 31 5 34.5 2 39" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 2 39 C 1 41 0.5 43 0.5 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 2 39 C 3.5 41 4.5 43 4 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />

      {/* arm L2 */}
      <path d="M 13 28 C 11 31.5 9.5 35.5 8.5 40" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 8.5 40 C 7.5 42 7 44 6.5 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 8.5 40 C 9.5 42 10 44 10.5 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />

      {/* arm L3 — center */}
      <path d="M 13 28 C 13 32 12.5 36.5 12 41" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 12 41 C 11 43 10.5 44.5 10 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 12 41 C 13 43 13.5 44.5 14 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 14 46 C 14.5 46.5 15.5 46 16 46" stroke={s} strokeWidth={w3} strokeLinecap="round" strokeOpacity={op3} />

      {/* arm L4 */}
      <path d="M 13 28 C 16 31 19 34 21 38" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 21 38 C 20.5 40.5 20 43 19.5 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 21 38 C 22.5 40.5 23 43 23 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />

      {/* arm L5 — far right of left note */}
      <path d="M 13 28 C 17 31 21 33.5 24 37" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 24 37 C 23 39.5 22.5 42 22 45" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 24 37 C 25.5 39.5 26 42 26.5 45" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />

      {/* ══ Right note roots ══ */}
      {/* arm R1 — far left of right note */}
      <path d="M 38 22 C 34 25.5 30 29 27 33.5" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 27 33.5 C 25 36.5 23.5 40 22.5 44" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 22.5 44 C 22 45 21.5 46 21 46" stroke={s} strokeWidth={w3} strokeLinecap="round" strokeOpacity={op3} />
      <path d="M 27 33.5 C 28.5 36.5 29 40 29 44" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />

      {/* arm R2 */}
      <path d="M 38 22 C 35.5 26 33 30 31.5 35" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 31.5 35 C 30 38 29.5 41.5 29 45" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 31.5 35 C 33 38 33.5 41.5 34 45" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />

      {/* arm R3 — center */}
      <path d="M 38 22 C 38 26.5 37.5 31.5 37 37" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 37 37 C 36 40 35.5 43 35 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 37 37 C 38 40 38.5 43 39 46" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />

      {/* arm R4 */}
      <path d="M 38 22 C 41.5 25.5 45 29 47.5 33.5" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 47.5 33.5 C 46.5 36.5 46 40 45.5 44" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 47.5 33.5 C 49 36.5 49.5 40 50 44" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />

      {/* arm R5 — far right */}
      <path d="M 38 22 C 43 25 48 28 52 31.5" stroke={s} strokeWidth={w1} strokeLinecap="round" strokeOpacity={op1} />
      <path d="M 52 31.5 C 53.5 34 54.5 37.5 55 41" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
      <path d="M 55 41 C 55.5 43 56 44.5 56.5 46" stroke={s} strokeWidth={w3} strokeLinecap="round" strokeOpacity={op3} />
      <path d="M 52 31.5 C 50.5 34.5 50 38 50.5 42" stroke={s} strokeWidth={w2} strokeLinecap="round" strokeOpacity={op2} />
    </svg>
  )
}
