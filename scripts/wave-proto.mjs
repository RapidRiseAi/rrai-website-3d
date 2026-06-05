// Numeric projection prototype for the Section-3 orb wave.
//
// The Section canvas camera (see Scene.jsx) is a horizontal PerspectiveCamera at
// (0, 0.15, 7.4), fov 42, looking down -z. We want the funnel's orbs to rearrange
// into a wide wave that fills the BOTTOM band of the viewport (below the cards).
//
// three.js runs headless in Node (pure matrix math — no WebGL), so we can project
// a candidate wave grid through the real camera and print where it lands on screen
// BEFORE wiring anything into HeroOrb. '#' = orbs land there; '.' = empty.
//
//   node scripts/wave-proto.mjs

import * as THREE from 'three'

const ASPECT = 1.9                 // typical desktop aspect (≈1900x1000)
const cam = new THREE.PerspectiveCamera(42, ASPECT, 0.1, 100)
cam.position.set(0, 0.15, 7.4)     // matches Scene.jsx; default look is down -z
cam.updateMatrixWorld(true)
cam.updateProjectionMatrix()

const MAPW = 92, MAPH = 30         // ASCII canvas (cols x rows)

function projectGrid({ groupX = 0, groupY, groupZ = 0, scale, rotX = 0, HW, zNear, zFar, edgeLift = 0, cols = 80, rows = 40 }) {
  const grid = new THREE.Group()
  grid.position.set(groupX, groupY, groupZ)
  grid.scale.setScalar(scale)
  grid.rotation.x = rotX
  grid.updateMatrixWorld(true)

  const cell = Array.from({ length: MAPH }, () => new Array(MAPW).fill(0))
  let onscreen = 0, total = 0
  let yMin = 99, yMax = -99, xMin = 99, xMax = -99
  const v = new THREE.Vector3()
  for (let r = 0; r < rows; r++) {
    const z = zNear + (zFar - zNear) * (r / (rows - 1))
    for (let c = 0; c < cols; c++) {
      const nx = c / (cols - 1) - 0.5            // -0.5..0.5
      const lx = nx * 2 * HW
      // wave height: lift the far L/R edges (rise into the side gutters), keep
      // the centre low so it stays clear of the cards/CTA.
      const ly = edgeLift * (nx * nx * 4)         // 0 at centre -> edgeLift at edges
      v.set(lx, ly, z).applyMatrix4(grid.matrixWorld)
      v.project(cam)
      total++
      if (v.x >= -1 && v.x <= 1 && v.y >= -1 && v.y <= 1 && v.z < 1) {
        onscreen++
        yMin = Math.min(yMin, v.y); yMax = Math.max(yMax, v.y)
        xMin = Math.min(xMin, v.x); xMax = Math.max(xMax, v.x)
        const col = Math.floor((v.x * 0.5 + 0.5) * (MAPW - 1))
        const row = Math.floor((1 - (v.y * 0.5 + 0.5)) * (MAPH - 1))
        cell[row][col]++
      }
    }
  }
  return { cell, onscreen, total, yMin, yMax, xMin, xMax }
}

function render(label, params) {
  const { cell, onscreen, total, yMin, yMax, xMin, xMax } = projectGrid(params)
  console.log(`\n=== ${label} ===`)
  console.log(JSON.stringify(params))
  const ramp = ' .:-=+*#%@'
  let maxC = 0
  for (const row of cell) for (const x of row) maxC = Math.max(maxC, x)
  const lines = cell.map(row =>
    row.map(x => x === 0 ? ' ' : ramp[Math.min(ramp.length - 1, 1 + Math.floor((x / maxC) * (ramp.length - 2)))]).join('')
  )
  // frame it
  console.log('+' + '-'.repeat(MAPW) + '+   (top = ndc y=+1)')
  lines.forEach((l, i) => console.log('|' + l + '|' + (i === Math.floor(MAPH / 2) ? ' <- screen center' : '')))
  console.log('+' + '-'.repeat(MAPW) + '+   (bottom = ndc y=-1)')
  console.log(`onscreen ${onscreen}/${total} (${(100 * onscreen / total).toFixed(0)}%)  ndcY[${yMin.toFixed(2)},${yMax.toFixed(2)}]  ndcX[${xMin.toFixed(2)},${xMax.toFixed(2)}]`)
}

// Tilt the wave up toward the camera (more head-on / face-on) while keeping it
// low. rotX raises the far edge; lower groupY to keep it out of the cards.
// Lower the back even more — keep the band in the very bottom of the screen.
render('N1: y=-2.7 z[3,-2.5] lift0.9', { groupY: -2.7, scale: 1.0, HW: 14, zNear: 3, zFar: -2.5, edgeLift: 0.9 })
render('N2: y=-2.7 z[2,-2]   lift0.9', { groupY: -2.7, scale: 1.0, HW: 14, zNear: 2, zFar: -2,   edgeLift: 0.9 })
render('N3: y=-2.6 z[2,-2.5] lift0.9', { groupY: -2.6, scale: 1.0, HW: 14, zNear: 2, zFar: -2.5, edgeLift: 0.9 })
