import { useState } from 'react'
import { X, Trash2, AlertTriangle, ArrowRight } from 'lucide-react'
import type { DiscoveryEdge, Artist } from '../types'
import { ArtistAvatar } from './ArtistPanel'

interface Props {
  edge: DiscoveryEdge
  onClose: () => void
  onDeleteEdge: (id: string) => void
  onSelectArtist: (artist: Artist) => void
}

export function EdgePanel({ edge, onClose, onDeleteEdge, onSelectArtist }: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { fromArtist, toArtist, connectorName, edgeType, notes } = edge

  return (
    <div className="h-full flex flex-col bg-[#0c0c19] border-l border-white/[0.07] w-80 flex-shrink-0">
      {/* Header */}
      <div className="flex items-start justify-between p-5 pb-4 border-b border-white/[0.06]">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-2.5">Connection</p>
          <div className="flex items-center gap-2 flex-wrap">
            {fromArtist ? (
              <button onClick={() => onSelectArtist(fromArtist)} className="flex items-center gap-1.5 hover:bg-white/[0.04] px-1.5 py-1 rounded-lg transition-colors -ml-1.5">
                <ArtistAvatar artist={fromArtist} size={20} />
                <span className="text-[12px] text-slate-300">{fromArtist.name}</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-600 italic">root discovery</span>
            )}
            <ArrowRight size={11} className="text-slate-700 flex-shrink-0" />
            <button onClick={() => onSelectArtist(toArtist)} className="flex items-center gap-1.5 hover:bg-white/[0.04] px-1.5 py-1 rounded-lg transition-colors -ml-1.5">
              <ArtistAvatar artist={toArtist} size={20} />
              <span className="text-[12px] text-slate-300">{toArtist.name}</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 mt-1">
          {!confirmDelete && (
            <button onClick={() => setConfirmDelete(true)} className="p-1.5 text-slate-600 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10" title="Delete"><Trash2 size={13} /></button>
          )}
          <button onClick={onClose} className="p-1.5 text-slate-600 hover:text-slate-300 transition-colors rounded-lg hover:bg-white/[0.05]" title="Close"><X size={14} /></button>
        </div>
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mx-4 mt-4 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
          <div className="flex items-start gap-2.5 mb-3">
            <AlertTriangle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-[12px] text-red-300">Delete this connection?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => { onDeleteEdge(edge.id); onClose() }} className="flex-1 py-1.5 rounded-lg text-[12px] bg-red-500/20 border border-red-500/35 text-red-300 hover:bg-red-500/30 transition-colors">Delete</button>
            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-1.5 rounded-lg text-[12px] bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:bg-white/[0.06] transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4 flex flex-col gap-5">
        {(connectorName || edgeType) && (
          <div className="flex flex-wrap gap-2">
            {connectorName && (
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Connector</p>
                <span className="px-2.5 py-1 rounded-lg text-[12px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">{connectorName}</span>
              </div>
            )}
            {edgeType && (
              <div>
                <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Type</p>
                <span className="px-2.5 py-1 rounded-lg text-[12px] bg-slate-700/50 text-slate-400 border border-white/[0.07]">{edgeType}</span>
              </div>
            )}
          </div>
        )}

        {notes && (
          <div>
            <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Discovery note</p>
            <p className="text-[12.5px] text-slate-400 leading-relaxed">{notes}</p>
          </div>
        )}

        {!connectorName && !edgeType && !notes && (
          <p className="text-[12px] text-slate-600 italic">No details recorded for this connection.</p>
        )}
      </div>
    </div>
  )
}
