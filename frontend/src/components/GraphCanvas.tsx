import { useRef, useEffect, useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react'
import type { GraphNode, GraphLink } from '../types'

// ── Types ─────────────────────────────────────────────────────────────────────

interface SimNode {
  id: string
  name: string
  color: string
  imageUrl: string | null
  x: number; y: number; vx: number; vy: number
  radius: number
  fixed?: boolean
  pinned?: boolean
}

interface Transform { x: number; y: number; scale: number }
interface SelectBox { startSX: number; startSY: number; currSX: number; currSY: number }
interface GroupMove { gx0: number; gy0: number; origPositions: Map<string, { x: number; y: number }> }

// ── Constants ─────────────────────────────────────────────────────────────────

const PALETTE = ['#818cf8', '#fbbf24', '#34d399', '#f472b6', '#60a5fa', '#fb923c']
const REST_LENGTH = 250
const REPULSION   = 20000
const CENTER_K    = 0.003

// ── Helpers ───────────────────────────────────────────────────────────────────

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function nodeColor(id: string): string {
  return PALETTE[hashString(id) % PALETTE.length]
}

function hexToRgb(hex: string): string {
  return `${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)}`
}

function lightenColor(hex: string, amt: number): string {
  return `rgb(${Math.min(255,parseInt(hex.slice(1,3),16)+amt)}, ${Math.min(255,parseInt(hex.slice(3,5),16)+amt)}, ${Math.min(255,parseInt(hex.slice(5,7),16)+amt)})`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y)
  ctx.arcTo(x+w, y, x+w, y+r, r); ctx.lineTo(x+w, y+h-r)
  ctx.arcTo(x+w, y+h, x+w-r, y+h, r); ctx.lineTo(x+r, y+h)
  ctx.arcTo(x, y+h, x, y+h-r, r); ctx.lineTo(x, y+r)
  ctx.arcTo(x, y, x+r, y, r); ctx.closePath()
}

function getInitials(name: string): string {
  const clean = name.replace(/^(The|A|An|El|La)\s+/i, '')
  const words = clean.split(/[\s&]+/).filter(w => w.length > 0)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + (words[1]?.[0] ?? '')).toUpperCase()
}

function linkKey(link: GraphLink): string {
  return `${link.source}→${link.target}`
}

// ── Mycelium strand drawing ───────────────────────────────────────────────────

function makeRng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 0xffffffff
  }
}

function drawFilament(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  rgb: string, alpha: number, width: number,
  wobbleAmt: number, seed: number,
) {
  const rng = makeRng(seed)
  const dx = x1 - x0, dy = y1 - y0
  const len = Math.sqrt(dx*dx + dy*dy) || 1
  const px = -dy/len, py = dx/len

  const steps = 3 + Math.floor(rng() * 3)
  const pts: {x:number;y:number}[] = [{x:x0, y:y0}]
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const wobble = (rng() - 0.5) * 2 * wobbleAmt
    pts.push({ x: x0 + dx*t + px*wobble, y: y0 + dy*t + py*wobble })
  }
  pts.push({x:x1, y:y1})

  const grad = ctx.createLinearGradient(x0, y0, x1, y1)
  grad.addColorStop(0,    `rgba(${rgb},0)`)
  grad.addColorStop(0.08, `rgba(${rgb},${alpha*0.6})`)
  grad.addColorStop(0.5,  `rgba(${rgb},${alpha})`)
  grad.addColorStop(0.92, `rgba(${rgb},${alpha*0.6})`)
  grad.addColorStop(1,    `rgba(${rgb},0)`)

  ctx.save()
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i+1].x) / 2
    const my = (pts[i].y + pts[i+1].y) / 2
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
  }
  ctx.lineTo(pts[pts.length-1].x, pts[pts.length-1].y)
  ctx.strokeStyle = grad
  ctx.lineWidth = width
  ctx.stroke()
  ctx.restore()
}

function drawMyceliumStrands(
  ctx: CanvasRenderingContext2D,
  ax: number, ay: number, bx: number, by: number,
  color: string, highlighted: boolean, edgeHash: number,
) {
  const dx = bx - ax, dy = by - ay
  const len = Math.sqrt(dx*dx + dy*dy) || 1
  const ux = dx/len, uy = dy/len
  const px = -uy, py = ux

  const rgb = hexToRgb(color)
  const rng = makeRng(edgeHash)
  const numFilaments = 3 + Math.floor(rng() * 3)
  const wobbleAmt = len * 0.10

  for (let i = 0; i < numFilaments; i++) {
    const fanA = (rng() - 0.5) * 22
    const fanB = (rng() - 0.5) * 22
    const insetA = rng() * 4
    const insetB = rng() * 4

    const sx = ax + px*fanA + ux*insetA
    const sy = ay + py*fanA + uy*insetA
    const ex = bx + px*fanB - ux*insetB
    const ey = by + py*fanB - uy*insetB

    const width = 0.7 + rng() * 0.8
    const alpha = highlighted ? 0.55 + rng() * 0.35 : 0.28 + rng() * 0.28

    drawFilament(ctx, sx, sy, ex, ey, rgb, alpha, width, wobbleAmt, edgeHash + i * 1301)

    if (rng() > 0.50 && len > 60) {
      const t = 0.25 + rng() * 0.50
      const bpx = sx + (ex-sx)*t + (rng()-0.5)*16
      const bpy = sy + (ey-sy)*t + (rng()-0.5)*16
      const branchLen = len * (0.07 + rng() * 0.13)
      const angle = (rng() - 0.5) * Math.PI * 0.55
      const cosA = Math.cos(angle), sinA = Math.sin(angle)
      const bex = bpx + (ux*cosA - uy*sinA) * branchLen
      const bey = bpy + (uy*cosA + ux*sinA) * branchLen

      const bAlpha = (highlighted ? 0.45 : 0.22) + rng() * 0.20
      const bGrad = ctx.createLinearGradient(bpx, bpy, bex, bey)
      bGrad.addColorStop(0,   `rgba(${rgb},${bAlpha})`)
      bGrad.addColorStop(0.6, `rgba(${rgb},${bAlpha*0.5})`)
      bGrad.addColorStop(1,   `rgba(${rgb},0)`)

      ctx.save()
      const cpBx = (bpx+bex)/2 + (rng()-0.5)*12
      const cpBy = (bpy+bey)/2 + (rng()-0.5)*12
      ctx.beginPath()
      ctx.moveTo(bpx, bpy)
      ctx.quadraticCurveTo(cpBx, cpBy, bex, bey)
      ctx.strokeStyle = bGrad
      ctx.lineWidth = (0.7 + rng() * 0.8) * 0.55
      ctx.stroke()
      ctx.restore()
    }
  }

  if (highlighted) {
    const midCurve = ((edgeHash % 77) - 38)
    const cpx = (ax+bx)/2 + px*midCurve
    const cpy = (ay+by)/2 + py*midCurve
    const gGrad = ctx.createLinearGradient(ax, ay, bx, by)
    gGrad.addColorStop(0,    `rgba(${rgb},0)`)
    gGrad.addColorStop(0.15, `rgba(${rgb},0.12)`)
    gGrad.addColorStop(0.5,  `rgba(${rgb},0.22)`)
    gGrad.addColorStop(0.85, `rgba(${rgb},0.12)`)
    gGrad.addColorStop(1,    `rgba(${rgb},0)`)
    ctx.save()
    ctx.shadowBlur = 18; ctx.shadowColor = color
    ctx.beginPath()
    ctx.moveTo(ax, ay)
    ctx.quadraticCurveTo(cpx, cpy, bx, by)
    ctx.strokeStyle = gGrad
    ctx.lineWidth = 9
    ctx.stroke()
    ctx.restore()
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  nodes: GraphNode[]
  links: GraphLink[]
  selectedNodeId: string | null
  selectedLinkKey: string | null
  onSelectNode: (node: GraphNode | null) => void
  onSelectLink: (link: GraphLink | null) => void
}

function screenToGraphDirect(sx: number, sy: number, t: Transform) {
  return { x: (sx - t.x) / t.scale, y: (sy - t.y) / t.scale }
}

export function GraphCanvas({ nodes, links, selectedNodeId, selectedLinkKey, onSelectNode, onSelectLink }: Props) {
  const canvasRef     = useRef<HTMLCanvasElement>(null)
  const containerRef  = useRef<HTMLDivElement>(null)
  const simNodesRef   = useRef<SimNode[]>([])
  const transformRef  = useRef<Transform>({ x: 0, y: 0, scale: 1 })
  const alphaRef      = useRef(1.0)
  const animFrameRef  = useRef<number>(0)
  const linksRef      = useRef(links)
  const nodesRef      = useRef(nodes)
  const selNodeIdRef  = useRef(selectedNodeId)
  const selLinkKeyRef = useRef(selectedLinkKey)
  const onSelNodeRef  = useRef(onSelectNode)
  const onSelLinkRef  = useRef(onSelectLink)
  const hovNodeIdRef  = useRef<string | null>(null)
  const hovLinkKeyRef = useRef<string | null>(null)
  const imgCacheRef   = useRef<Map<string, HTMLImageElement>>(new Map())
  const [, forceUpdate] = useState(0)
  const initializedRef = useRef(false)

  const groupSelRef   = useRef<Set<string>>(new Set())
  const dragRef       = useRef<{ nodeId: string; sx0: number; sy0: number } | null>(null)
  const groupMoveRef  = useRef<{ gx0: number; gy0: number; origPositions: Map<string, { x: number; y: number }> } | null>(null)
  const panRef        = useRef<{ sx0: number; sy0: number; tx0: number; ty0: number } | null>(null)
  const selectBoxRef  = useRef<SelectBox | null>(null)
  const lastClickRef  = useRef<{ id: string; t: number } | null>(null)

  useEffect(() => { linksRef.current = links }, [links])
  useEffect(() => { nodesRef.current = nodes }, [nodes])
  useEffect(() => { selNodeIdRef.current = selectedNodeId }, [selectedNodeId])
  useEffect(() => { selLinkKeyRef.current = selectedLinkKey }, [selectedLinkKey])
  useEffect(() => { onSelNodeRef.current = onSelectNode }, [onSelectNode])
  useEffect(() => { onSelLinkRef.current = onSelectLink }, [onSelectLink])

  // Load images
  useEffect(() => {
    const cache = imgCacheRef.current
    for (const n of nodes) {
      if (n.imageUrl && !cache.has(n.id)) {
        const img = new Image()
        img.src = n.imageUrl
        img.onload = () => forceUpdate(c => c + 1)
        cache.set(n.id, img)
      }
    }
  }, [nodes])

  // Sync sim nodes when graph data changes (add/remove nodes)
  useEffect(() => {
    const canvas = canvasRef.current
    const w = canvas?.width ?? 800
    const h = canvas?.height ?? 600
    const existing = new Map(simNodesRef.current.map(n => [n.id, n]))
    const linksCurrent = linksRef.current
    const edgeCounts = new Map<string, number>()
    for (const l of linksCurrent) {
      edgeCounts.set(l.source, (edgeCounts.get(l.source) ?? 0) + 1)
      edgeCounts.set(l.target, (edgeCounts.get(l.target) ?? 0) + 1)
    }
    simNodesRef.current = nodes.map(n => {
      if (existing.has(n.id)) {
        const prev = existing.get(n.id)!
        return { ...prev, name: n.name, imageUrl: n.imageUrl, color: nodeColor(n.id), radius: 28 + Math.min((edgeCounts.get(n.id)??0)*3,18) }
      }
      const angle = Math.random() * Math.PI * 2
      const dist = 80 + Math.random() * 200
      return {
        id: n.id, name: n.name, color: nodeColor(n.id), imageUrl: n.imageUrl,
        x: w/2 + Math.cos(angle)*dist, y: h/2 + Math.sin(angle)*dist,
        vx: 0, vy: 0,
        radius: 28 + Math.min((edgeCounts.get(n.id)??0)*3, 18),
      }
    })
    alphaRef.current = Math.max(alphaRef.current, 0.4)
  }, [nodes])

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const screenToGraph = useCallback((sx: number, sy: number) => {
    const { x: tx, y: ty, scale } = transformRef.current
    return { x: (sx-tx)/scale, y: (sy-ty)/scale }
  }, [])

  const getNodeAt = useCallback((sx: number, sy: number): SimNode | null => {
    const gp = screenToGraph(sx, sy)
    const sims = simNodesRef.current
    for (let i = sims.length-1; i >= 0; i--) {
      const n = sims[i]
      const dx = n.x-gp.x, dy = n.y-gp.y
      if (dx*dx+dy*dy <= n.radius*n.radius*1.3) return n
    }
    return null
  }, [screenToGraph])

  const getLinkAt = useCallback((sx: number, sy: number): GraphLink | null => {
    const gp = screenToGraph(sx, sy)
    const nodeMap = new Map(simNodesRef.current.map(n => [n.id, n]))
    const THRESHOLD = 10
    for (const link of linksRef.current) {
      const a = nodeMap.get(link.source), b = nodeMap.get(link.target)
      if (!a || !b) continue
      const dx = b.x-a.x, dy = b.y-a.y
      const edgeLen = Math.sqrt(dx*dx+dy*dy) || 1
      const ux = dx/edgeLen, uy = dy/edgeLen
      const px = -uy, py = ux
      const eHash = hashString(`${link.source}-${link.target}`)
      const curveMag = ((eHash % 77) - 38)
      const ax2 = a.x + ux*(a.radius-3), ay2 = a.y + uy*(a.radius-3)
      const bx2 = b.x - ux*(b.radius-3), by2 = b.y - uy*(b.radius-3)
      const cpx = (ax2+bx2)/2 + px*curveMag
      const cpy = (ay2+by2)/2 + py*curveMag
      for (let i = 0; i <= 20; i++) {
        const t = i/20, mt = 1-t
        const qx = mt*mt*ax2 + 2*mt*t*cpx + t*t*bx2
        const qy = mt*mt*ay2 + 2*mt*t*cpy + t*t*by2
        if ((qx-gp.x)**2 + (qy-gp.y)**2 < THRESHOLD*THRESHOLD) return link
      }
    }
    return null
  }, [screenToGraph])

  const getNodesInBox = useCallback((sx1: number, sy1: number, sx2: number, sy2: number): Set<string> => {
    const g1 = screenToGraph(sx1, sy1), g2 = screenToGraph(sx2, sy2)
    const minX = Math.min(g1.x,g2.x), maxX = Math.max(g1.x,g2.x)
    const minY = Math.min(g1.y,g2.y), maxY = Math.max(g1.y,g2.y)
    const ids = new Set<string>()
    for (const n of simNodesRef.current) {
      if (n.x>=minX && n.x<=maxX && n.y>=minY && n.y<=maxY) ids.add(n.id)
    }
    return ids
  }, [screenToGraph])

  // ── Simulation + draw loop ────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const tick = (w: number, h: number) => {
      const sims = simNodesRef.current
      const ls = linksRef.current
      const alpha = alphaRef.current
      const cx = w/2, cy = h/2

      // Repulsion
      for (let i = 0; i < sims.length; i++) {
        const a = sims[i]
        for (let j = i+1; j < sims.length; j++) {
          const b = sims[j]
          const dx = b.x-a.x || 0.01, dy = b.y-a.y || 0.01
          const dist2 = dx*dx+dy*dy
          if (dist2 < 120000) {
            const dist = Math.sqrt(dist2)
            const minD = a.radius+b.radius+20
            const d = Math.max(dist, minD)
            const force = REPULSION/(d*d) * alpha
            const fx = force*dx/d, fy = force*dy/d
            if (!a.fixed && !a.pinned) { a.vx -= fx; a.vy -= fy }
            if (!b.fixed && !b.pinned) { b.vx += fx; b.vy += fy }
          }
        }
      }

      // Springs
      const nodeMap = new Map(sims.map(n => [n.id, n]))
      for (const l of ls) {
        const a = nodeMap.get(l.source), b = nodeMap.get(l.target)
        if (!a || !b) continue
        const dx = b.x-a.x || 0.01, dy = b.y-a.y || 0.01
        const dist = Math.sqrt(dx*dx+dy*dy) || 1
        const force = (dist - REST_LENGTH) * 0.04 * alpha
        const fx = force*dx/dist, fy = force*dy/dist
        if (!a.fixed && !a.pinned) { a.vx += fx; a.vy += fy }
        if (!b.fixed && !b.pinned) { b.vx -= fx; b.vy -= fy }
      }

      // Center
      for (const n of sims) {
        if (n.fixed || n.pinned) continue
        n.vx += (cx - n.x) * CENTER_K * alpha
        n.vy += (cy - n.y) * CENTER_K * alpha
        n.vx *= 0.72; n.vy *= 0.72
        n.x += n.vx; n.y += n.vy
      }
    }

    const draw = () => {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const { x: tx, y: ty, scale } = transformRef.current
      const sims = simNodesRef.current
      const nodeMap = new Map(sims.map(n => [n.id, n]))
      const ls = linksRef.current
      const hovNId = hovNodeIdRef.current
      const selNId = selNodeIdRef.current
      const selLKey = selLinkKeyRef.current
      const hovLKey = hovLinkKeyRef.current
      const groupSel = groupSelRef.current
      const imgCache = imgCacheRef.current
      const now = Date.now()

      ctx.fillStyle = '#09090f'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.save()
      ctx.translate(tx, ty)
      ctx.scale(scale, scale)

      // ── Links ──
      for (const link of ls) {
        const a = nodeMap.get(link.source), b = nodeMap.get(link.target)
        if (!a || !b) continue
        const key = linkKey(link)
        const linkSel = selLKey === key
        const linkHov = hovLKey === key
        const involved = linkSel || linkHov
          || hovNId === link.source || hovNId === link.target
          || selNId === link.source || selNId === link.target
          || groupSel.has(link.source) || groupSel.has(link.target)

        const color = a.color
        const eHash = hashString(`${link.source}-${link.target}`)
        const dx = b.x-a.x, dy = b.y-a.y
        const edgeLen = Math.sqrt(dx*dx+dy*dy) || 1
        const ux = dx/edgeLen, uy = dy/edgeLen
        const ax2 = a.x + ux*(a.radius-3), ay2 = a.y + uy*(a.radius-3)
        const bx2 = b.x - ux*(b.radius-3), by2 = b.y - uy*(b.radius-3)

        drawMyceliumStrands(ctx, ax2, ay2, bx2, by2, color, involved, eHash)

        if (involved && link.connectorName) {
          const px = -uy, py = ux
          const curveMag = ((eHash % 77) - 38)
          const cpx = (ax2+bx2)/2 + px*curveMag
          const cpy = (ay2+by2)/2 + py*curveMag
          const lx = 0.25*ax2 + 0.5*cpx + 0.25*bx2
          const ly = 0.25*ay2 + 0.5*cpy + 0.25*by2
          const label = link.connectorName
          ctx.font = '10px Inter, system-ui, sans-serif'
          const tw = ctx.measureText(label).width
          ctx.fillStyle = linkSel ? `rgba(${hexToRgb(color)},0.25)` : 'rgba(9,9,15,0.88)'
          roundRect(ctx, lx-tw/2-6, ly-9, tw+12, 17, 4)
          ctx.fill()
          if (linkSel) { ctx.strokeStyle = `rgba(${hexToRgb(color)},0.6)`; ctx.lineWidth = 1; ctx.stroke() }
          ctx.fillStyle = `rgba(${hexToRgb(color)},0.95)`
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(label, lx, ly-0.5)
          if (linkHov && !linkSel) {
            ctx.font = '9px Inter, system-ui, sans-serif'
            ctx.fillStyle = 'rgba(148,163,184,0.7)'
            ctx.fillText('click to edit', lx, ly+14)
          }
        }
      }

      // ── Nodes ──
      for (const node of sims) {
        const isSel = selNId === node.id
        const isHov = hovNId === node.id
        const inGroup = groupSel.has(node.id)
        const { color } = node
        const pulse = isSel ? 1 + Math.sin(now/700)*0.055 : 1
        const r = node.radius * (isHov ? 1.07 : pulse)
        const rgb = hexToRgb(color)
        const img = imgCache.get(node.id)
        const hasPhoto = img?.complete && (img.naturalWidth ?? 0) > 0

        // Glow ring
        ctx.save()
        ctx.shadowBlur = isSel ? 42 : isHov ? 26 : inGroup ? 22 : 14
        ctx.shadowColor = color
        ctx.beginPath()
        ctx.arc(node.x, node.y, r, 0, Math.PI*2)
        if (hasPhoto) {
          ctx.strokeStyle = `rgba(${rgb},0.5)`; ctx.lineWidth = 2; ctx.stroke()
        } else {
          const grad = ctx.createRadialGradient(node.x-r*0.32, node.y-r*0.38, r*0.04, node.x, node.y, r)
          grad.addColorStop(0, lightenColor(color, 72))
          grad.addColorStop(0.55, color)
          grad.addColorStop(1, `rgba(${rgb},0.75)`)
          ctx.fillStyle = grad; ctx.fill()
        }
        ctx.restore()

        // Photo
        if (hasPhoto && img) {
          ctx.save()
          ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI*2); ctx.clip()
          const ratio = Math.max(r*2/(img.naturalWidth||1), r*2/(img.naturalHeight||1))
          const iw = (img.naturalWidth||1)*ratio, ih = (img.naturalHeight||1)*ratio
          ctx.drawImage(img, node.x-iw/2, node.y-ih/2, iw, ih)
          const vg = ctx.createRadialGradient(node.x, node.y, r*0.35, node.x, node.y, r)
          vg.addColorStop(0, 'rgba(0,0,0,0)')
          vg.addColorStop(0.65, 'rgba(0,0,0,0.2)')
          vg.addColorStop(1, `rgba(${rgb},0.52)`)
          ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI*2); ctx.fillStyle = vg; ctx.fill()
          ctx.restore()
        }

        // Selection ring
        ctx.save(); ctx.shadowBlur = 0
        ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI*2)
        if (isSel) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.stroke() }
        else if (inGroup) { ctx.setLineDash([4,3]); ctx.strokeStyle = `rgba(${rgb},0.9)`; ctx.lineWidth = 1.8; ctx.stroke(); ctx.setLineDash([]) }
        else if (isHov) { ctx.strokeStyle = `rgba(${rgb},0.75)`; ctx.lineWidth = 1.2; ctx.stroke() }
        else if (!hasPhoto) { ctx.strokeStyle = `rgba(${rgb},0.25)`; ctx.lineWidth = 0.8; ctx.stroke() }
        ctx.restore()

        // Initials
        if (!hasPhoto) {
          ctx.save(); ctx.shadowBlur = 0
          const fontSize = Math.max(9, Math.floor(r*0.48))
          ctx.font = `500 ${fontSize}px Inter, system-ui, sans-serif`
          ctx.fillStyle = 'rgba(255,255,255,0.93)'
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
          ctx.fillText(getInitials(node.name), node.x, node.y)
          ctx.restore()
        }

        // Name label
        const lText = node.name
        const ly = node.y + r + 14
        ctx.font = '11.5px Inter, system-ui, sans-serif'
        const lw = ctx.measureText(lText).width
        ctx.save()
        ctx.fillStyle = 'rgba(9,9,15,0.78)'
        roundRect(ctx, node.x-lw/2-6, ly-9, lw+12, 16, 4); ctx.fill()
        ctx.fillStyle = isSel ? '#f1f5f9' : isHov ? '#e2e8f0' : inGroup ? '#c7d2fe' : '#64748b'
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(lText, node.x, ly-0.5)
        ctx.restore()

        // Pin dot
        if (node.pinned) {
          ctx.save()
          ctx.beginPath(); ctx.arc(node.x+r*0.68, node.y-r*0.68, 3.5, 0, Math.PI*2)
          ctx.fillStyle = `rgba(${rgb},0.9)`; ctx.shadowBlur = 6; ctx.shadowColor = color; ctx.fill()
          ctx.restore()
        }
      }

      // Selection box
      if (selectBoxRef.current) {
        const sb = selectBoxRef.current
        const g1 = screenToGraphDirect(sb.startSX, sb.startSY, transformRef.current)
        const g2 = screenToGraphDirect(sb.currSX, sb.currSY, transformRef.current)
        const bx = Math.min(g1.x,g2.x), by = Math.min(g1.y,g2.y)
        const bw = Math.abs(g2.x-g1.x), bh = Math.abs(g2.y-g1.y)
        ctx.save()
        ctx.fillStyle = 'rgba(129,140,248,0.05)'; ctx.fillRect(bx, by, bw, bh)
        ctx.strokeStyle = 'rgba(129,140,248,0.7)'; ctx.lineWidth = 1/scale
        ctx.setLineDash([6/scale, 4/scale]); ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([])
        ctx.restore()
      }

      ctx.restore()
    }

    // Init
    const rect = container.getBoundingClientRect()
    canvas.width = rect.width; canvas.height = rect.height
    if (!initializedRef.current && simNodesRef.current.length > 0) {
      initializedRef.current = true
      for (let i = 0; i < 300; i++) {
        alphaRef.current = Math.pow(0.985, i)
        tick(canvas.width, canvas.height)
      }
      alphaRef.current = 0.05
    }

    const loop = () => {
      const r2 = container.getBoundingClientRect()
      if (Math.abs(canvas.width-r2.width) > 1 || Math.abs(canvas.height-r2.height) > 1) {
        canvas.width = r2.width; canvas.height = r2.height
      }
      if (alphaRef.current > 0.001) {
        tick(canvas.width, canvas.height)
        alphaRef.current *= 0.988
      }
      draw()
      animFrameRef.current = requestAnimationFrame(loop)
    }
    animFrameRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { groupSelRef.current = new Set(); forceUpdate(c => c+1) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Wheel zoom
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const mx = e.clientX-rect.left, my = e.clientY-rect.top
      const { x: tx, y: ty, scale } = transformRef.current
      const factor = e.deltaY < 0 ? 1.12 : 0.89
      const newScale = Math.max(0.12, Math.min(5, scale*factor))
      const sf = newScale/scale
      transformRef.current = { x: mx-sf*(mx-tx), y: my-sf*(my-ty), scale: newScale }
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [])

  // ── Mouse handlers ────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX-rect.left, sy = e.clientY-rect.top
    const node = getNodeAt(sx, sy)
    const shift = e.shiftKey

    if (node) {
      const inGroup = groupSelRef.current.has(node.id)
      if (inGroup && groupSelRef.current.size > 1) {
        const gp = screenToGraph(sx, sy)
        const origPositions = new Map<string, {x:number;y:number}>()
        for (const id of groupSelRef.current) {
          const n = simNodesRef.current.find(x => x.id === id)
          if (n) { origPositions.set(id, {x:n.x, y:n.y}); n.fixed = true }
        }
        groupMoveRef.current = { gx0: gp.x, gy0: gp.y, origPositions }
      } else {
        if (!shift) groupSelRef.current = new Set()
        dragRef.current = { nodeId: node.id, sx0: sx, sy0: sy }
        node.fixed = true
      }
    } else {
      if (shift) {
        selectBoxRef.current = { startSX: sx, startSY: sy, currSX: sx, currSY: sy }
      } else {
        groupSelRef.current = new Set()
        const { x: tx, y: ty } = transformRef.current
        panRef.current = { sx0: sx, sy0: sy, tx0: tx, ty0: ty }
        canvas.style.cursor = 'grabbing'
      }
    }
  }, [getNodeAt, screenToGraph])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX-rect.left, sy = e.clientY-rect.top

    if (groupMoveRef.current) {
      const { gx0, gy0, origPositions } = groupMoveRef.current
      const gp = screenToGraph(sx, sy)
      const dgx = gp.x-gx0, dgy = gp.y-gy0
      for (const [id, orig] of origPositions) {
        const n = simNodesRef.current.find(x => x.id === id)
        if (n) { n.x = orig.x+dgx; n.y = orig.y+dgy; n.vx = 0; n.vy = 0 }
      }
      alphaRef.current = Math.max(alphaRef.current, 0.12)
    } else if (dragRef.current) {
      const gp = screenToGraph(sx, sy)
      const n = simNodesRef.current.find(x => x.id === dragRef.current!.nodeId)
      if (n) { n.x = gp.x; n.y = gp.y; n.vx = 0; n.vy = 0; alphaRef.current = Math.max(alphaRef.current, 0.15) }
    } else if (panRef.current) {
      const { sx0, sy0, tx0, ty0 } = panRef.current
      transformRef.current = { ...transformRef.current, x: tx0+sx-sx0, y: ty0+sy-sy0 }
    } else if (selectBoxRef.current) {
      selectBoxRef.current = { ...selectBoxRef.current, currSX: sx, currSY: sy }
    } else {
      const node = getNodeAt(sx, sy)
      hovNodeIdRef.current = node?.id ?? null
      if (node) {
        canvas.style.cursor = 'pointer'
        hovLinkKeyRef.current = null
      } else {
        const link = getLinkAt(sx, sy)
        hovLinkKeyRef.current = link ? linkKey(link) : null
        canvas.style.cursor = link ? 'pointer' : 'grab'
      }
    }
  }, [screenToGraph, getNodeAt, getLinkAt])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX-rect.left, sy = e.clientY-rect.top

    if (groupMoveRef.current) {
      for (const [id] of groupMoveRef.current.origPositions) {
        const n = simNodesRef.current.find(x => x.id === id)
        if (n) { n.fixed = false; n.pinned = true }
      }
      groupMoveRef.current = null
    } else if (dragRef.current) {
      const { nodeId, sx0, sy0 } = dragRef.current
      const moved = Math.sqrt((sx-sx0)**2+(sy-sy0)**2) > 6
      const n = simNodesRef.current.find(x => x.id === nodeId)
      if (n) {
        n.fixed = false
        if (moved) {
          n.pinned = true
        } else {
          const last = lastClickRef.current
          if (last && last.id === nodeId && Date.now()-last.t < 350) {
            n.pinned = false; alphaRef.current = Math.max(alphaRef.current, 0.12)
          } else {
            lastClickRef.current = { id: nodeId, t: Date.now() }
            if (e.shiftKey) {
              const s = groupSelRef.current
              if (s.has(nodeId)) { s.delete(nodeId) } else { s.add(nodeId) }
              groupSelRef.current = new Set(s)
            } else {
              const graphNode = nodesRef.current.find(x => x.id === nodeId) ?? null
              onSelNodeRef.current(graphNode)
              onSelLinkRef.current(null)
            }
          }
        }
      }
      dragRef.current = null
    } else if (panRef.current) {
      panRef.current = null
      canvas.style.cursor = 'grab'
    } else if (selectBoxRef.current) {
      const sb = selectBoxRef.current
      const ids = getNodesInBox(sb.startSX, sb.startSY, sb.currSX, sb.currSY)
      const bw = Math.abs(sb.currSX-sb.startSX), bh = Math.abs(sb.currSY-sb.startSY)
      if (bw > 8 && bh > 8 && ids.size > 0) {
        if (e.shiftKey) { for (const id of ids) groupSelRef.current.add(id) }
        else { groupSelRef.current = ids }
      }
      selectBoxRef.current = null
    }
  }, [getNodesInBox])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragRef.current || panRef.current || groupMoveRef.current) return
    const canvas = canvasRef.current; if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX-rect.left, sy = e.clientY-rect.top
    const node = getNodeAt(sx, sy)
    if (!node && !e.shiftKey) {
      const link = getLinkAt(sx, sy)
      if (link) {
        onSelNodeRef.current(null)
        onSelLinkRef.current(link)
        groupSelRef.current = new Set()
      } else {
        onSelNodeRef.current(null)
        onSelLinkRef.current(null)
        groupSelRef.current = new Set()
      }
    }
  }, [getNodeAt, getLinkAt])

  const handleMouseLeave = useCallback(() => {
    hovNodeIdRef.current = null
    hovLinkKeyRef.current = null
    dragRef.current = null
    groupMoveRef.current = null
    panRef.current = null
    selectBoxRef.current = null
  }, [])

  // ── Controls ──────────────────────────────────────────────────────────────────

  const zoom = useCallback((factor: number) => {
    const canvas = canvasRef.current; if (!canvas) return
    const { x: tx, y: ty, scale } = transformRef.current
    const cx = canvas.width/2, cy = canvas.height/2
    const newScale = Math.max(0.12, Math.min(5, scale*factor))
    const sf = newScale/scale
    transformRef.current = { x: cx-sf*(cx-tx), y: cy-sf*(cy-ty), scale: newScale }
  }, [])

  const fitView = useCallback(() => {
    const canvas = canvasRef.current
    const sims = simNodesRef.current
    if (!canvas || sims.length === 0) return
    const margin = 90
    const minX = Math.min(...sims.map(n=>n.x-n.radius))
    const maxX = Math.max(...sims.map(n=>n.x+n.radius))
    const minY = Math.min(...sims.map(n=>n.y-n.radius))
    const maxY = Math.max(...sims.map(n=>n.y+n.radius))
    const gw = maxX-minX, gh = maxY-minY
    const s = Math.min((canvas.width-margin*2)/gw, (canvas.height-margin*2)/gh, 1.8)
    const cx = (minX+maxX)/2, cy = (minY+maxY)/2
    transformRef.current = { x: canvas.width/2-cx*s, y: canvas.height/2-cy*s, scale: s }
  }, [])

  const resetLayout = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const w = canvas.width, h = canvas.height
    const ls = linksRef.current
    const edgeCounts = new Map<string, number>()
    for (const l of ls) {
      edgeCounts.set(l.source, (edgeCounts.get(l.source)??0)+1)
      edgeCounts.set(l.target, (edgeCounts.get(l.target)??0)+1)
    }
    simNodesRef.current = nodesRef.current.map(n => {
      const angle = Math.random()*Math.PI*2
      const dist = 80 + Math.random()*200
      return {
        id: n.id, name: n.name, color: nodeColor(n.id), imageUrl: n.imageUrl,
        x: w/2+Math.cos(angle)*dist, y: h/2+Math.sin(angle)*dist,
        vx: 0, vy: 0,
        radius: 28 + Math.min((edgeCounts.get(n.id)??0)*3, 18),
        pinned: false,
      }
    })
    groupSelRef.current = new Set()
    alphaRef.current = 1.0
    initializedRef.current = false
    transformRef.current = { x: 0, y: 0, scale: 1 }
  }, [])

  const controls = [
    { icon: ZoomIn,    fn: () => zoom(1.2),  label: 'Zoom in'      },
    { icon: ZoomOut,   fn: () => zoom(0.8),  label: 'Zoom out'     },
    { icon: Maximize2, fn: fitView,           label: 'Fit view'     },
    { icon: RotateCcw, fn: resetLayout,       label: 'Reset layout' },
  ]

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
      />

      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[11px] text-slate-700 pointer-events-none select-none">
        {nodes.length} artists · {links.length} connections · shift+drag to select · dbl-click to unpin
      </div>

      <div className="absolute bottom-5 right-4 flex flex-col gap-1">
        {controls.map(({ icon: Icon, fn, label }) => (
          <button key={label} onClick={fn} title={label}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0f0f1c]/90 border border-white/[0.08] text-slate-500 hover:text-slate-200 hover:border-white/20 transition-all backdrop-blur-sm">
            <Icon size={13} />
          </button>
        ))}
      </div>
    </div>
  )
}
