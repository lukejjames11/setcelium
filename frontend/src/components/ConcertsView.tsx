import { useState } from 'react'
import { Calendar, MapPin, Hash, AlertTriangle, CheckCircle2, Pencil, Trash2, Check, X, Ticket } from 'lucide-react'
import type { Concert } from '../types'

interface Props {
  concerts: Concert[]
  onDeleteConcert: (id: string) => void
  onEditConcert: (updated: Concert) => void
}

export function ConcertsView({ concerts, onDeleteConcert, onEditConcert }: Props) {
  const byYear = concerts.reduce<Record<string, Concert[]>>((acc, c) => {
  const year = c.showDate ? c.showDate.slice(0, 4) : 'Unknown date'
  ;(acc[year] ??= []).push(c)
  return acc
}, {})

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))
  const needsReview = concerts.filter(c => c.needsReview)

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-8">
          <div>
            <h1 className="text-slate-200" style={{ fontSize: '20px', fontWeight: 500 }}>Concert history</h1>
            <p className="text-[12px] text-slate-600 mt-1">{concerts.length} shows recorded</p>
          </div>
          {needsReview.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle size={11} className="text-amber-400" />
              <span className="text-[11px] text-amber-400">{needsReview.length} need review</span>
            </div>
          )}
        </div>

        {years.length === 0 && (
          <div className="text-center py-16">
            <Ticket size={28} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-600 text-[13px]">No concerts yet. Add one or import an .mbox file.</p>
          </div>
        )}

        {years.map(year => (
          <div key={year} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-slate-500" style={{ fontSize: '13px', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace' }}>{year}</span>
              <div className="flex-1 h-px bg-white/[0.05]" />
              <span className="text-[11px] text-slate-700">{byYear[year].length}</span>
            </div>
            <div className="flex flex-col gap-3">
              {byYear[year]
                .sort((a, b) => (b.showDate ?? '').localeCompare(a.showDate ?? ''))
                .map(c => (
                  <ConcertCard key={c.id} concert={c} onDelete={onDeleteConcert} onEdit={onEditConcert} />
                ))
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ConcertCard({ concert, onDelete, onEdit }: {
  concert: Concert
  onDelete: (id: string) => void
  onEdit: (c: Concert) => void
}) {
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)

  const [eArtist, setEArtist] = useState(concert.artist ?? '')
  const [eVenue, setEVenue] = useState(concert.venue ?? '')
  const [eCity, setECity] = useState(concert.city ?? '')
  const [eState, setEState] = useState(concert.state ?? '')
  const [eDate, setEDate] = useState(concert.showDate ?? '')
  const [eOrder, setEOrder] = useState(concert.orderNumber ?? '')
  const [eReview, setEReview] = useState(concert.needsReview)

  const handleSave = () => {
    onEdit({
      ...concert,
      artist: eArtist.trim(),
      venue: eVenue.trim(),
      city: eCity.trim() || null,
      state: eState.trim() || null,
      showDate: eDate,
      orderNumber: eOrder.trim() || null,
      needsReview: eReview,
    })
    setEditing(false)
  }

  const location = [concert.city, concert.state].filter(Boolean).join(', ')
  const formattedDate = concert.showDate ? new Date(concert.showDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Unknown date'

  if (editing) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Artist</label>
            <input value={eArtist} onChange={e => setEArtist(e.target.value)} className={inputCls} autoFocus />
          </div>
          <div>
            <label className={labelCls}>Venue</label>
            <input value={eVenue} onChange={e => setEVenue(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input value={eCity} onChange={e => setECity(e.target.value)} className={inputCls} placeholder="City" />
          </div>
          <div>
            <label className={labelCls}>State</label>
            <input value={eState} onChange={e => setEState(e.target.value)} className={inputCls} placeholder="State" />
          </div>
          <div>
            <label className={labelCls}>Date</label>
            <input type="date" value={eDate} onChange={e => setEDate(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
          </div>
          <div>
            <label className={labelCls}>Order #</label>
            <input value={eOrder} onChange={e => setEOrder(e.target.value)} className={inputCls} placeholder="Optional" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer" onClick={() => setEReview(v => !v)}>
          <div
            className="w-3.5 h-3.5 rounded border flex items-center justify-center"
            style={eReview ? { background: 'rgba(245,158,11,0.7)', borderColor: 'rgba(245,158,11,0.8)' } : { background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.12)' }}
          >
            {eReview && <span style={{ fontSize: '8px', color: '#fff' }}>✓</span>}
          </div>
          <span className="text-[11px] text-slate-500">Needs review</span>
        </label>
        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-colors">
            <Check size={11} /> Save
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-lg text-[11px] text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="group bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.09] rounded-xl px-4 py-3 transition-colors">
      {confirmDel ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] text-red-300">Delete this show?</p>
          <div className="flex gap-2">
            <button onClick={() => onDelete(concert.id)} className="text-[11px] text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/25 transition-colors">Delete</button>
            <button onClick={() => setConfirmDel(false)} className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[13px] text-slate-200" style={{ fontWeight: 500 }}>{concert.artist ?? 'Unknown artist'}</span>
              {concert.needsReview && (
                <span className="flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20 flex-shrink-0">
                  <AlertTriangle size={8} /> review
                </span>
              )}
              {!concert.needsReview && (
                <CheckCircle2 size={11} className="text-emerald-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-[12px] text-slate-400">{concert.venue ?? 'Unknown venue'}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {location && (
                <span className="flex items-center gap-1 text-[11px] text-slate-600">
                  <MapPin size={10} />{location}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-slate-600">
                <Calendar size={10} />{formattedDate}
              </span>
              {concert.orderNumber && (
                <span className="flex items-center gap-1 text-[11px] text-slate-700" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  <Hash size={9} />{concert.orderNumber}
                </span>
              )}
              {concert.source === 'ticketmaster_import' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">TM import</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={() => setEditing(true)} className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-white/[0.05] transition-colors"><Pencil size={12} /></button>
            <button onClick={() => setConfirmDel(true)} className="p-1.5 text-slate-600 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"><Trash2 size={12} /></button>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[12px] text-slate-200 focus:outline-none focus:border-indigo-500/50"
const labelCls = "text-[10px] text-slate-600 uppercase tracking-wider block mb-1"
