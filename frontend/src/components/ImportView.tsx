import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, Mail, X } from 'lucide-react'
import { importMbox, type ImportResult } from '../api'

type Phase = 'idle' | 'uploading' | 'done' | 'error'

export function ImportView() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [dragging, setDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    if (!f.name.endsWith('.mbox')) {
      setErrorMsg('Please upload a .mbox file')
      return
    }
    setFile(f)
    setPhase('uploading')
    setErrorMsg(null)
    try {
      const res = await importMbox(f)
      setResult(res)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed')
      setPhase('error')
    }
  }

  const reset = () => {
    setPhase('idle'); setFile(null); setResult(null); setErrorMsg(null)
  }

  return (
    <div className="flex-1 overflow-y-auto scrollbar-hide">
      <div className="max-w-xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-slate-200" style={{ fontSize: '20px', fontWeight: 500 }}>Import from .mbox</h1>
          <p className="text-[12px] text-slate-600 mt-1">Upload a Gmail/Apple Mail export and Setcelium will extract concert confirmations automatically.</p>
        </div>

        {/* Drop zone */}
        {phase === 'idle' && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-2xl py-16 cursor-pointer transition-all"
            style={{
              borderColor: dragging ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)',
              background: dragging ? 'rgba(99,102,241,0.05)' : 'rgba(255,255,255,0.01)',
            }}
          >
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)' }}>
              <Mail size={24} className="text-indigo-400" />
            </div>
            <div className="text-center">
              <p className="text-slate-300 text-[13px]">Drop your .mbox file here</p>
              <p className="text-slate-600 text-[11px] mt-1">or click to browse</p>
            </div>
            <input ref={inputRef} type="file" accept=".mbox" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          </div>
        )}

        {/* Uploading */}
        {phase === 'uploading' && (
          <div className="flex flex-col items-center gap-5 py-12 border border-white/[0.06] rounded-2xl bg-white/[0.01]">
            <Loader2 size={28} className="text-indigo-400 animate-spin" />
            <div className="text-center">
              <p className="text-slate-300 text-[13px]">Processing {file?.name}…</p>
              <p className="text-slate-600 text-[11px] mt-1">Scanning emails for concert confirmations</p>
            </div>
          </div>
        )}

        {/* Done */}
        {phase === 'done' && result && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-[13px] text-emerald-300" style={{ fontWeight: 500 }}>Import complete</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{file?.name}</p>
              </div>
              <button onClick={reset} className="ml-auto p-1 text-slate-600 hover:text-slate-300 transition-colors"><X size={13} /></button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <StatCard value={result.addedCount} label="Added" color="#34d399" />
              <StatCard value={result.flaggedCount} label="Flagged for review" color="#fbbf24" />
              <StatCard value={result.skippedCount} label="Skipped" color="#64748b" />
            </div>

            {result.flaggedCount > 0 && (
              <div className="flex items-start gap-2.5 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-400">{result.flaggedCount} concert{result.flaggedCount !== 1 ? 's were' : ' was'} flagged for review. Check the Concerts tab to confirm them.</p>
              </div>
            )}

            <button onClick={reset} className="mt-2 text-[12px] text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2">
              Import another file
            </button>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[13px] text-red-300" style={{ fontWeight: 500 }}>Import failed</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{errorMsg}</p>
              </div>
            </div>
            <button onClick={reset} className="text-[12px] text-slate-600 hover:text-slate-400 transition-colors underline underline-offset-2">
              Try again
            </button>
          </div>
        )}

        {/* Instructions */}
        {phase === 'idle' && (
          <div className="mt-8 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={12} className="text-slate-600" />
              <span className="text-[10px] text-slate-600 uppercase tracking-widest">How to export</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                ['Gmail', 'Google Takeout → Mail → Export in .mbox format'],
                ['Apple Mail', 'Select mailbox → File → Export Mailbox'],
                ['Thunderbird', 'Tools → ImportExportTools NG → Export folder'],
              ].map(([app, tip]) => (
                <div key={app} className="flex gap-2">
                  <span className="text-[11px] text-slate-500 w-20 flex-shrink-0">{app}</span>
                  <span className="text-[11px] text-slate-600">{tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
      <span style={{ fontSize: '28px', fontWeight: 300, color, fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>{value}</span>
      <span className="text-[10px] text-slate-600 text-center">{label}</span>
    </div>
  )
}
