import { useState } from 'react'
import { X, User, Link2, Music2 } from 'lucide-react'
import type { CreateEdgeBody, CreateConcertBody } from '../api'

interface Props {
  open: boolean
  onClose: () => void
  onAddArtist: (data: { name: string; imageUrl: string | null }) => Promise<void>
  onAddEdge: (data: CreateEdgeBody) => Promise<void>
  onAddConcert: (data: CreateConcertBody) => Promise<void>
}

type Tab = 'artist' | 'connection' | 'concert'

export function AddDataSheet({ open, onClose, onAddArtist, onAddEdge, onAddConcert }: Props) {
  const [tab, setTab] = useState<Tab>('artist')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Artist form
  const [aName, setAName] = useState('')
  const [aImageUrl, setAImageUrl] = useState('')

  // Edge form
  const [eFrom, setEFrom] = useState('')
  const [eTo, setETo] = useState('')
  const [eConnector, setEConnector] = useState('')
  const [eType, setEType] = useState('')
  const [eNotes, setENotes] = useState('')

  // Concert form
  const [cArtist, setCArtist] = useState('')
  const [cVenue, setCVenue] = useState('')
  const [cCity, setCCity] = useState('')
  const [cState, setCState] = useState('')
  const [cDate, setCDate] = useState('')

  if (!open) return null

  const reset = () => {
    setAName(''); setAImageUrl('')
    setEFrom(''); setETo(''); setEConnector(''); setEType(''); setENotes('')
    setCArtist(''); setCVenue(''); setCCity(''); setCState(''); setCDate('')
    setError(null)
  }

  const handleClose = () => { reset(); onClose() }

  const handleSubmit = async () => {
    setError(null)
    setSaving(true)
    try {
      if (tab === 'artist') {
        if (!aName.trim()) { setError('Name is required'); setSaving(false); return }
        await onAddArtist({ name: aName.trim(), imageUrl: aImageUrl.trim() || null })
      } else if (tab === 'connection') {
        if (!eTo.trim()) { setError('To artist name is required'); setSaving(false); return }
        await onAddEdge({
          fromArtistName: eFrom.trim() || null,
          toArtistName: eTo.trim(),
          connectorName: eConnector.trim() || null,
          edgeType: eType.trim() || null,
          notes: eNotes.trim() || null,
        })
      } else {
        if (!cArtist.trim() || !cVenue.trim() || !cDate) { setError('Artist, venue, and date are required'); setSaving(false); return }
        await onAddConcert({
          artist: cArtist.trim(),
          venue: cVenue.trim(),
          city: cCity.trim() || null,
          state: cState.trim() || null,
          showDate: cDate,
        })
      }
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const tabs: { key: Tab; icon: typeof User; label: string }[] = [
    { key: 'artist',     icon: User,   label: 'Artist'     },
    { key: 'connection', icon: Link2,  label: 'Connection' },
    { key: 'concert',    icon: Music2, label: 'Concert'    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full sm:w-[440px] max-h-[85vh] bg-[#0f0f1c] border border-white/[0.09] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <h2 className="text-slate-200" style={{ fontSize: '15px', fontWeight: 500 }}>Add to graph</h2>
          <button onClick={handleClose} className="p-1.5 text-slate-600 hover:text-slate-300 rounded-lg hover:bg-white/[0.05] transition-colors"><X size={15} /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3">
          {tabs.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => { setTab(key); setError(null) }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition-all flex-1 justify-center"
              style={tab === key
                ? { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }
                : { color: '#475569', border: '1px solid transparent' }
              }
            >
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 py-4">
          {tab === 'artist' && (
            <div className="flex flex-col gap-3">
              <Field label="Name *">
                <input value={aName} onChange={e => setAName(e.target.value)} placeholder="Artist or band name" className={inputCls} autoFocus />
              </Field>
              <Field label="Image URL">
                <input value={aImageUrl} onChange={e => setAImageUrl(e.target.value)} placeholder="https://..." className={inputCls} />
              </Field>
            </div>
          )}

          {tab === 'connection' && (
            <div className="flex flex-col gap-3">
              <Field label="From artist" hint="Leave blank for a root discovery">
                <input value={eFrom} onChange={e => setEFrom(e.target.value)} placeholder="e.g. The Black Keys" className={inputCls} autoFocus />
              </Field>
              <Field label="To artist *">
                <input value={eTo} onChange={e => setETo(e.target.value)} placeholder="e.g. Jack White" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Connector name">
                  <input value={eConnector} onChange={e => setEConnector(e.target.value)} placeholder="e.g. opened show" className={inputCls} />
                </Field>
                <Field label="Edge type">
                  <input value={eType} onChange={e => setEType(e.target.value)} placeholder="e.g. shared_member" className={inputCls} />
                </Field>
              </div>
              <Field label="Discovery note">
                <textarea value={eNotes} onChange={e => setENotes(e.target.value)} placeholder="How did you discover this connection?" rows={3} className={`${inputCls} resize-none`} />
              </Field>
            </div>
          )}

          {tab === 'concert' && (
            <div className="flex flex-col gap-3">
              <Field label="Artist *">
                <input value={cArtist} onChange={e => setCArtist(e.target.value)} placeholder="Artist name" className={inputCls} autoFocus />
              </Field>
              <Field label="Venue *">
                <input value={cVenue} onChange={e => setCVenue(e.target.value)} placeholder="Venue name" className={inputCls} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input value={cCity} onChange={e => setCCity(e.target.value)} placeholder="Philadelphia" className={inputCls} />
                </Field>
                <Field label="State">
                  <input value={cState} onChange={e => setCState(e.target.value)} placeholder="PA" className={inputCls} />
                </Field>
              </div>
              <Field label="Show date *">
                <input type="date" value={cDate} onChange={e => setCDate(e.target.value)} className={`${inputCls} [color-scheme:dark]`} />
              </Field>
            </div>
          )}

          {error && (
            <p className="mt-3 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-white/[0.06]">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full py-2.5 rounded-xl text-[13px] text-white transition-all disabled:opacity-50"
            style={{ background: saving ? 'rgba(99,102,241,0.5)' : 'rgba(99,102,241,0.85)', boxShadow: '0 0 20px rgba(99,102,241,0.2)' }}
          >
            {saving ? 'Saving…' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputCls = "w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[12px] text-slate-200 focus:outline-none focus:border-indigo-500/50 placeholder-slate-700"

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <label className="text-[10px] text-slate-600 uppercase tracking-wider">{label}</label>
        {hint && <span className="text-[10px] text-slate-700">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
