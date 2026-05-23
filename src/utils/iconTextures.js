import * as THREE from 'three'

const DRAW = [
  // 0 Analytics
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    ctx.fillStyle = ctx.strokeStyle
    ctx.fillRect(3, 14, 4, 7); ctx.fillRect(10, 9, 4, 12); ctx.fillRect(17, 5, 4, 16)
    ctx.beginPath(); ctx.moveTo(2, 21); ctx.lineTo(22, 21)
    ctx.moveTo(2, 3); ctx.lineTo(2, 21); ctx.stroke()
  },
  // 1 IoT / Chip
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    ctx.strokeRect(7, 7, 10, 10)
    for (const y of [9, 12, 15]) {
      ctx.beginPath(); ctx.moveTo(3, y); ctx.lineTo(7, y); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(17, y); ctx.lineTo(21, y); ctx.stroke()
    }
    for (const x of [9, 12, 15]) {
      ctx.beginPath(); ctx.moveTo(x, 3); ctx.lineTo(x, 7); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x, 17); ctx.lineTo(x, 21); ctx.stroke()
    }
    ctx.fillStyle = ctx.strokeStyle
    ctx.beginPath(); ctx.arc(12, 12, 1.4, 0, Math.PI * 2); ctx.fill()
  },
  // 2 Identity
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    ctx.strokeRect(2, 5, 20, 14)
    ctx.beginPath(); ctx.arc(8, 12, 2.5, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(13, 9.5); ctx.lineTo(20, 9.5)
    ctx.moveTo(13, 13); ctx.lineTo(18, 13)
    ctx.moveTo(13, 16); ctx.lineTo(16, 16)
    ctx.stroke()
  },
  // 3 Integrations
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    for (const [x, y] of [[3,3],[17,3],[3,17],[17,17]]) ctx.strokeRect(x, y, 4, 4)
    ctx.beginPath(); ctx.arc(12, 12, 2, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath()
    for (const [x, y] of [[3,3],[17,3],[3,17],[17,17]])
      { ctx.moveTo(x + 2, y + 2); ctx.lineTo(12, 12) }
    ctx.stroke()
  },
  // 4 Automation (gear)
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 6
    ctx.beginPath(); ctx.arc(12, 12, 7, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(12, 12, 3, 0, Math.PI * 2); ctx.stroke()
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath()
      ctx.moveTo(12 + Math.cos(a) * 4.5, 12 + Math.sin(a) * 4.5)
      ctx.lineTo(12 + Math.cos(a) * 9.5, 12 + Math.sin(a) * 9.5)
      ctx.stroke()
    }
  },
  // 5 Code
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    ctx.beginPath()
    ctx.moveTo(15, 18); ctx.lineTo(21, 12); ctx.lineTo(15, 6); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(9, 6); ctx.lineTo(3, 12); ctx.lineTo(9, 18); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(14, 4); ctx.lineTo(10, 20); ctx.stroke()
  },
  // 6 Web Platform
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    ctx.strokeRect(2, 3, 20, 15)
    ctx.beginPath(); ctx.moveTo(2, 7); ctx.lineTo(22, 7); ctx.stroke()
    ctx.fillStyle = ctx.strokeStyle
    ctx.beginPath(); ctx.arc(5.5, 5, 1, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(9, 5, 1, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(12, 13, 3, 0, Math.PI * 2); ctx.stroke()
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath()
      ctx.moveTo(12 + Math.cos(a) * 4, 13 + Math.sin(a) * 4)
      ctx.lineTo(12 + Math.cos(a) * 5.5, 13 + Math.sin(a) * 5.5); ctx.stroke()
    }
    ctx.beginPath(); ctx.moveTo(8, 21); ctx.lineTo(16, 21)
    ctx.moveTo(12, 18); ctx.lineTo(12, 21); ctx.stroke()
  },
  // 7 AI Assistant
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 6
    ctx.strokeRect(3, 8, 18, 11)
    ctx.beginPath()
    ctx.moveTo(8, 8); ctx.lineTo(8, 5); ctx.lineTo(16, 5); ctx.lineTo(16, 8); ctx.stroke()
    ctx.fillStyle = ctx.strokeStyle
    ctx.beginPath(); ctx.arc(9, 13, 1.5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.arc(15, 13, 1.5, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.moveTo(9, 17); ctx.quadraticCurveTo(12, 19.5, 15, 17); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(12, 5); ctx.lineTo(12, 3); ctx.stroke()
    ctx.beginPath(); ctx.arc(12, 2.5, 1, 0, Math.PI * 2); ctx.fill()
  },
  // 8 Database
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    for (const y of [5, 12, 19]) {
      ctx.beginPath(); ctx.ellipse(12, y, 8, 2.5, 0, 0, Math.PI * 2); ctx.stroke()
    }
    ctx.beginPath()
    ctx.moveTo(4, 5); ctx.lineTo(4, 19)
    ctx.moveTo(20, 5); ctx.lineTo(20, 19); ctx.stroke()
  },
  // 9 Cloud
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    ctx.beginPath()
    ctx.moveTo(8, 19); ctx.lineTo(5, 19)
    ctx.arc(5, 15, 4, Math.PI * 0.5, Math.PI * 1.5)
    ctx.arc(8, 10, 5, Math.PI, Math.PI * 1.85)
    ctx.arc(14, 8, 6, Math.PI * 1.25, Math.PI * 0.1)
    ctx.arc(18, 14, 4, -0.4, Math.PI * 0.5)
    ctx.lineTo(8, 19); ctx.stroke()
  },
  // 10 Security
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 6
    ctx.beginPath()
    ctx.moveTo(12, 2); ctx.lineTo(20, 6); ctx.lineTo(20, 13)
    ctx.quadraticCurveTo(20, 20, 12, 23)
    ctx.quadraticCurveTo(4, 20, 4, 13)
    ctx.lineTo(4, 6); ctx.closePath(); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(8.5, 12.5); ctx.lineTo(11, 15.5); ctx.lineTo(15.5, 9.5); ctx.stroke()
  },
  // 11 Workflow
  ctx => {
    ctx.shadowColor = '#aaf0ff'; ctx.shadowBlur = 5
    for (const x of [2, 10, 18]) ctx.strokeRect(x, 9, 5, 6)
    ctx.beginPath()
    ctx.moveTo(7, 12); ctx.lineTo(10, 12)
    ctx.moveTo(15, 12); ctx.lineTo(18, 12); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(8.5, 10.5); ctx.lineTo(10, 12); ctx.lineTo(8.5, 13.5); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(16.5, 10.5); ctx.lineTo(18, 12); ctx.lineTo(16.5, 13.5); ctx.stroke()
  },
]

export const ICON_LABELS = [
  'Analytics', 'IoT / Chip', 'Identity', 'Integrations',
  'Automation', 'Code', 'Web Platform', 'AI Assistant',
  'Database', 'Cloud', 'Security', 'Workflow',
]

function makeGlowDotTexture() {
  const S = 64
  const c = document.createElement('canvas'); c.width = c.height = S
  const ctx = c.getContext('2d')
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  g.addColorStop(0,    'rgba(255,255,255,1)')
  g.addColorStop(0.18, 'rgba(180,235,255,0.95)')
  g.addColorStop(0.45, 'rgba(60,170,255,0.45)')
  g.addColorStop(0.75, 'rgba(0,80,200,0.12)')
  g.addColorStop(1,    'rgba(0,0,0,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, S, S)
  return new THREE.CanvasTexture(c)
}

let _glowDotTex = null
export function getGlowDotTexture() {
  if (!_glowDotTex) _glowDotTex = makeGlowDotTexture()
  return _glowDotTex
}

// Icon texture: small dark plate + crisp glowing icon — premium embedded node
export function createIconTexture(index) {
  const S = 256
  const c = document.createElement('canvas'); c.width = c.height = S
  const ctx = c.getContext('2d')
  ctx.clearRect(0, 0, S, S)

  // Background plate — small, contained, transparent at edges
  const plateR = 78
  const bg = ctx.createRadialGradient(128, 128, 0, 128, 128, plateR)
  bg.addColorStop(0,    'rgba(0,  10, 28, 0.78)')
  bg.addColorStop(0.55, 'rgba(0,   6, 20, 0.62)')
  bg.addColorStop(0.85, 'rgba(0,   3, 12, 0.20)')
  bg.addColorStop(1,    'rgba(0,   0,  6, 0)')
  ctx.fillStyle = bg
  ctx.beginPath(); ctx.arc(128, 128, plateR, 0, Math.PI * 2); ctx.fill()

  // Subtle inner glow halo
  const halo = ctx.createRadialGradient(128, 128, 30, 128, 128, plateR - 4)
  halo.addColorStop(0,    'rgba(0,  90, 220, 0.10)')
  halo.addColorStop(1,    'rgba(0,  20,  80, 0)')
  ctx.fillStyle = halo
  ctx.beginPath(); ctx.arc(128, 128, plateR - 4, 0, Math.PI * 2); ctx.fill()

  // Crisp thin rim
  ctx.shadowColor = '#7fd8ff'; ctx.shadowBlur = 7
  ctx.strokeStyle = 'rgba(150, 220, 255, 0.85)'; ctx.lineWidth = 1.6
  ctx.beginPath(); ctx.arc(128, 128, plateR - 2, 0, Math.PI * 2); ctx.stroke()
  ctx.shadowBlur = 0

  // Icon centered — refined, bright blue-white
  const iconRadius = plateR - 18
  const margin = 128 - iconRadius
  const scale = (iconRadius * 2) / 24
  ctx.save()
  ctx.translate(margin, margin)
  ctx.scale(scale, scale)
  ctx.strokeStyle = '#cfeeff'
  ctx.fillStyle = '#cfeeff'
  ctx.lineWidth = 1.5 / scale
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (index < DRAW.length) DRAW[index](ctx)
  ctx.restore()

  const tex = new THREE.CanvasTexture(c)
  tex.anisotropy = 8
  return tex
}
