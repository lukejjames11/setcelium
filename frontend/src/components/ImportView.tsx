import { useState, useRef } from 'react'
import { Upload, CheckCircle2, AlertTriangle, Loader2, Mail, Zap } from 'lucide-react'
import { importMbox, type ImportResult } from '../api'

interface Props {
  onImportComplete?: () => void
}

type Stage = 'idle' | 'uploading' | 'done' | 'error'

export function ImportView({ onImportComplete }: Props) {
  const [stage, setStage] = useState<Stage>('idle')
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.mbox')) {
      alert('Please select a .mbox file exported from Google Takeout.')
      return
    }
    setFileName(file.name)
    setStage('uploading')
    setErrorMsg('')
    try {
      const res = await importMbox(file)
      setResult(res)
      setStage('done')
      onImportComplete?.()
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed')
      setStage('error')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-hide">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-slate-100 mb-1" style={{ fontSize: '20px', fontWeight: 500 }}>Import concerts</h1>
          <p className="text-[13px] text-slate-500">
            Upload a Google Takeout .mbox export — Setcelium scans for Ticketmaster order confirmations and extracts concert data using Claude.
          </p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl px-5 py-4 mb-6">
          <p className="text-[11px] text-slate-600 tracking-widest uppercase mb-3">How it works</p>
          <div className="flex flex-col gap-2.5">
            {[
              { icon: Mail, label: 'Filter', desc: 'Candidate emails identified by sender + subject line — no LLM calls until it\'s a real ticket confirmation.' },
              { icon: Zap, label: 'Extract', desc: 'Cleaned email text is passed to Claude Haiku with a structured extraction prompt. Artist, venue, date, order number.' },
              { icon: AlertTriangle, label: 'Flag', desc: 'Low-confidence extractions are surfaced for manual review. Nothing is silently dropped or blindly trusted.' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon size={11} className="text-indigo-400" />
                </div>
                <div>
                  <span className="text-[12px] text-slate-300">{label}</span>
                  <span className="text-[12px] text-slate-500 ml-2">{desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {stage === 'idle' && (
          <div
            onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl px-8 py-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
              isDragOver ? 'border-indigo-400/60 bg-indigo-500/5' : 'border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02]'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-all ${isDragOver ? 'bg-indigo-500/20' : 'bg-white/[0.04]'}`}>
              <Upload size={20} className={isDragOver ? 'text-indigo-400' : 'text-slate-500'} />
            </div>
            <p className="text-[13px] text-slate-300 mb-1">Drop your .mbox file here</p>
            <p className="text-[11px] text-slate-600">or click to browse</p>
            <p className="text-[10px] text-slate-700 mt-3">
              Export from Google Takeout → Mail → Select all mail → .mbox format
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".mbox"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>
        )}

        {stage === 'uploading' && (
          <div className="border border-white/[0.07] rounded-xl px-5 py-6 flex flex-col items-center gap-3">
            <Loader2 size={20} className="text-indigo-400 animate-spin" />
            <p className="text-[13px] text-slate-200">Importing {fileName}…</p>
            <p className="text-[11px] text-slate-500">Scanning, parsing, and saving — this can take a few minutes for a large file.</p>
          </div>
        )}

        {stage === 'error' && (
          <div className="border border-red-500/25 bg-red-500/10 rounded-xl px-5 py-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-400" />
              <p className="text-[13px] text-red-300">Import failed</p>
            </div>
            <p className="text-[11px] text-slate-500">{errorMsg}</p>
            <button onClick={() => setStage('idle')} className="mt-1 self-start text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors">Try again</button>
          </div>
        )}

        {stage === 'done' && result && (
          <div className="border border-white/[0.07] rounded-xl px-5 py-5">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <p className="text-[13px] text-slate-200">Import complete</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3">
                <p className="text-[11px] text-slate-600 mb-1">Added</p>
                <p className="text-slate-100" style={{ fontSize: '22px', fontWeight: 300 }}>{result.addedCount}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3">
                <p className="text-[11px] text-slate-600 mb-1">Flagged</p>
                <p className="text-amber-400" style={{ fontSize: '22px', fontWeight: 300 }}>{result.flaggedCount}</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg px-4 py-3">
                <p className="text-[11px] text-slate-600 mb-1">Skipped (duplicate)</p>
                <p className="text-slate-500" style={{ fontSize: '22px', fontWeight: 300 }}>{result.skippedCount}</p>
              </div>
            </div>
            <button
              onClick={() => { setStage('idle'); setResult(null) }}
              className="mt-4 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Import another file
            </button>
          </div>
        )}

        {stage === 'idle' && (
          <div className="mt-8">
            <p className="text-[11px] text-slate-600 tracking-widest uppercase mb-4">Getting your .mbox file</p>
            <div className="flex flex-col gap-1.5">
              {[
                'Go to takeout.google.com',
                'Click "Deselect all", then enable only "Mail"',
                'Under Mail settings, select "All mail" and .mbox format',
                'Export and download the archive',
                'Locate the .mbox file inside the downloaded zip',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[10px] text-slate-700 mt-0.5 flex-shrink-0 w-4 text-right" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{i + 1}.</span>
                  <p className="text-[12px] text-slate-500">{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}