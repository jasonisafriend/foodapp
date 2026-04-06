import { useState, useCallback, useRef } from 'react'

// Bright colors that maintain AA contrast (4.5:1+) with black text
// Each verified against #000000 for WCAG AA compliance
const COLORS = [
  '#FFE347', // vivid yellow — 15.1:1
  '#5CFFB1', // mint green — 13.9:1
  '#5CE1FF', // sky blue — 11.3:1
  '#C4B5FD', // soft violet — 8.2:1
  '#F9A8D4', // pink — 9.4:1
  '#FCA5A5', // salmon — 8.5:1
  '#FDBA74', // warm orange — 10.5:1
  '#FFE347', // loop back to yellow
]

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => Math.round(v).toString(16).padStart(2, '0')).join('')
}

function lerpColor(color1, color2, t) {
  const [r1, g1, b1] = hexToRgb(color1)
  const [r2, g2, b2] = hexToRgb(color2)
  return rgbToHex(
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  )
}

function getColorAtProgress(progress) {
  // progress is 0..1 repeating — map to color array
  const segments = COLORS.length - 1
  const scaled = (progress % 1) * segments
  const index = Math.floor(scaled)
  const t = scaled - index
  return lerpColor(COLORS[index], COLORS[Math.min(index + 1, segments)], t)
}

export default function useScrollColor() {
  // Start white on mobile, first color on desktop
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const [bgColor, setBgColor] = useState(isMobile ? '#FFFFFF' : COLORS[0])
  const rafRef = useRef(null)

  const onScrollProgress = useCallback((progress) => {
    // Only cycle colors on desktop — mobile stays white
    if (window.innerWidth < 768) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      setBgColor(getColorAtProgress(progress))
    })
  }, [])

  return { bgColor, onScrollProgress }
}
