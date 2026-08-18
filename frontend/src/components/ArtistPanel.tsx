import { useState } from 'react'
import { X, Music2, Link2, ArrowRight, Pencil, Trash2, Check, AlertTriangle } from 'lucide-react'
import type { Artist, DiscoveryEdge, Concert } from '../types'

interface Props {
  artist: Artist
  edges: DiscoveryEdge[]
  concerts: Concert[]
  onClose: () => void
  onSelectArtist: (artist: Artist) => void
  onEditArtist: (updated: Artist) => void
  onDeleteArtist: (id: string) => void
  onDeleteEdge: (id: string) => void
}

export function ArtistPanel({ artist, edges, concerts, onClose, onSelectArtist, onEditArtist, onDeleteArtist, onDeleteEdge }: Props) {
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [eName, setEName] = useState(artist.name)
  const [eImageUrl, setEImageUrl] = useState(artist.imageUrl ?? '')

  const artistEdges = edges.filter(e =>
    e.fromArtist?.id === artist.id || e.toArtist.id === artist.id
  )
  const artistConcerts = concerts.filter(c => c.artist === artist.name)

  const resetForm = () => { setEName(artist.name); setEImageUrl(artist.imageUrl ?? '') }

  const handleSave = () => {
    if (!eName.trim()) return
    onEditArtist({ ...artist, name: eName.trim(), imageUrl: eImageUrl.trim() || null })
    setEditing(false)
  }

  const handleCancelEdit = () => { resetForm(); setEditing(false) }

  return (
    <div className="h-full flex flex-col bg-[#0c0c19] border-l border-white/[0.07] w-80 flex-shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <ArtistAvatar artist={artist} size={44} />
          <div className="min-w-0">
            {editing ? (
              <input
                value={eName}
                onChange={e => setEName(e.target.value)}
                autoFocus
                className="bg-white/[0.06] border border-white/[0.12] rounded px-2 py-0.5 text-slate-100 w-full focus:outline-none focus:border-indigo-500/50"
                style={{ fontSize: '14px' }}
              />
            ) : (
              <h2 className="text-slate-100 truncate" style={{ fontSize: '15px', fontWeight: 500 }}>{artist.name}</h2>
            )}
            <p className="text-[11px] text-slate-600 mt-0.5">{artistEdges.length} connection{artistEdges.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          {!editing && !confirmDelete && (
            <>
              <button onClick={() => { resetForm(); setEditing(true) }} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded-lg hover:bg-white/[0.05]" title="Edit"><Pencil size={13} /></button>
              <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Delete"><Trash2 size={13} /></button>
            </>
          )}
          {editing && (
            <>
              <button onClick={handleSave} className="p-1.5 text-emerald-400 hover:text-emerald-300 transition-colors rounded-lg hover:bg-emerald-500/10" title="Save"><Check size={14} /></button>
              <button onClick={handleCancelEdit} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded-lg hover:bg-white/[0.05]" title="Cancel"><X size={14} /></button>
            </>
          )}
          {!editing && (
            <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded-lg hover:bg-white/[0.05] ml-1" title="Close"><X size={14} /></button>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2.5 mb-3">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[12px] text-red-300">Delete {artist.name}?</p>
              <p className="text-[11px] text-slate-500 mt-0.5">This will remove the artist from your graph.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onDeleteArtist(artist.id)} className="flex-1 py-1.5 rounded-lg text-[12px] bg-red-500/20 border border-red-500/35 text-red-300 hover:bg-red-500/30 transition-colors">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 rounded-lg text-[12px] bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Edit form */}
        {editing && (
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <label className="text-[10px] text-slate-600 uppercase tracking-wider block mb-1.5">Image URL</label>
            <input
              value={eImageUrl}
              onChange={e => setEImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder-slate-700"
            />
          </div>
        )}

        {/* Connections */}
        {artistEdges.length > 0 && !editing && (
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-1.5 mb-3">
              <Link2 size={11} className="text-slate-600" />
              <span className="text-[10px] text-slate-600 tracking-widest uppercase">Connections ({artistEdges.length})</span>
            </div>
            <div className="flex flex-col gap-3">
              {artistEdges.map(edge => {
                const other = edge.fromArtist?.id === artist.id ? edge.toArtist : edge.fromArtist
                if (!other) return null
                return (
                  <EdgeRow
                    key={edge.id}
                    edge={edge}
                    other={other}
                    onSelectArtist={onSelectArtist}
                    onDeleteEdge={onDeleteEdge}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Concerts */}
        {artistConcerts.length > 0 && !editing && (
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-3">
              <Music2 size={11} className="text-slate-600" />
              <span className="text-[10px] text-slate-600 tracking-widest uppercase">Seen live ({artistConcerts.length})</span>
            </div>
            <div className="flex flex-col gap-2">
              {artistConcerts.map(c => (
                <div key={c.id} className="bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[12px] text-slate-300">{c.venue}</p>
                      {(c.city || c.state) && (
                        <p className="text-[11px] text-slate-500 mt-0.5">{[c.city, c.state].filter(Boolean).join(', ')}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[11px] text-slate-500 flex-shrink-0" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {new Date(c.showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {c.needsReview && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">review</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function EdgeRow({ edge, other, onSelectArtist, onDeleteEdge }: {
  edge: DiscoveryEdge; other: Artist
  onSelectArtist: (a: Artist) => void; onDeleteEdge: (id: string) => void
}) {
  const [confirmDel, setConfirmDel] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSelectArtist(other)}
          className="flex items-center gap-2 min-w-0 flex-1 hover:bg-white/[0.03] rounded-lg px-2 py-1 -mx-2 transition-colors"
        >
          <ArtistAvatar artist={other} size={24} />
          <span className="text-[12px] text-slate-300 truncate">{other.name}</span>
          <ArrowRight size={11} className="text-slate-700 flex-shrink-0 ml-auto" />
        </button>
        <div className="flex items-center gap-0.5 ml-2 flex-shrink-0">
          <button onClick={() => setConfirmDel(true)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Remove"><X size={11} /></button>
        </div>
      </div>

      {confirmDel && (
        <div className="mt-1 ml-8 bg-red-500/10 border border-red-500/20 rounded-lg px-2.5 py-2">
          <p className="text-[11px] text-red-300 mb-1.5">Remove this connection?</p>
          <div className="flex gap-1.5">
            <button onClick={() => onDeleteEdge(edge.id)} className="text-[11px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25 transition-colors">Remove</button>
            <button onClick={() => setConfirmDel(false)} className="text-[11px] text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {!confirmDel && (edge.connectorName || edge.edgeType) && (
        <div className="ml-8 mt-1 flex flex-wrap gap-1">
          {edge.connectorName && (
            <span className="px-1.5 py-px rounded text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">{edge.connectorName}</span>
          )}
          {edge.edgeType && (
            <span className="px-1.5 py-px rounded text-[10px] bg-slate-700/50 text-slate-400 border border-white/[0.07]">{edge.edgeType}</span>
          )}
        </div>
      )}
    </div>
  )
}

export function ArtistAvatar({ artist, size }: { artist: Artist; size: number }) {
  const color = nodeColor(artist.id)
  const [imgError, setImgError] = useState(false)
  const showImg = artist.imageUrl && !imgError

  return (
    <div
      className="rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
      style={{
        width: size, height: size,
        background: showImg ? undefined : `radial-gradient(circle at 38% 35%, ${lighten(color, 60)}, ${color})`,
        boxShadow: `0 0 ${size/3}px ${color}55`,
      }}
    >
      {showImg ? (
        <img src={artist.imageUrl!} alt={artist.name} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      ) : (
        <span style={{ fontSize: Math.max(8, size*0.38), fontFamily: 'Inter, sans-serif', fontWeight: 500, color: 'rgba(255,255,255,0.93)' }}>
          {getInitials(artist.name)}
        </span>
      )}
    </div>
  )
}

function nodeColor(id: string): string {
  const PALETTE = ['#818cf8', '#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#fb923c']
  let h = 0
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0
  return PALETTE[Math.abs(h) % PALETTE.length]
}

function getInitials(name: string): string {
  const clean = name.replace(/^(The|A|An|El|La)\s+/i, '')
  const words = clean.split(/[\s&]+/).filter(w => w.length > 0)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
}

function lighten(hex: string, amount: number): string {
  const r = Math.min(255, parseInt(hex.slice(1,3),16)+amount)
  const g = Math.min(255, parseInt(hex.slice(3,5),16)+amount)
  const b = Math.min(255, parseInt(hex.slice(5,7),16)+amount)
  return `rgb(${r},${g},${b})`
}
