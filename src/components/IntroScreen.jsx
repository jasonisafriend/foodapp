import { useEffect, useRef, useState } from 'react'
import { HandSwipeLeft, Pause, Play } from '@phosphor-icons/react'

// NOTE: These Figma-hosted image URLs expire ~7 days after fetch.
// Before shipping, download each image and replace with /intro/*.jpg paths.
const BG_IMAGES = [
  'https://www.figma.com/api/mcp/asset/5dcec286-aea6-441a-b622-6fff6fae24d4',
  'https://www.figma.com/api/mcp/asset/a83f3937-f12a-4fa7-abb3-d0d2f273b51c',
  'https://www.figma.com/api/mcp/asset/1cb3223c-471e-42d5-8aba-a65082d0fef6',
  'https://www.figma.com/api/mcp/asset/b7d580db-d146-4742-9343-1858c8b3bbbb',
  'https://www.figma.com/api/mcp/asset/0287626e-e4cc-41c4-bd2e-73f6b36653bd',
  'https://www.figma.com/api/mcp/asset/af505507-0b54-4e6f-8cc8-e25d2ae3301a',
  'https://www.figma.com/api/mcp/asset/e6d21a73-4e43-404a-9306-cac9dd3be17b',
  'https://www.figma.com/api/mcp/asset/f5fc7bd2-168f-4128-a1bc-1f5e64e8b7c6',
  'https://www.figma.com/api/mcp/asset/e1db03e8-0dc5-4f82-95fd-265baf6602a8',
  'https://www.figma.com/api/mcp/asset/9a6eec4e-1268-4cc4-9856-24be0e88bd80',
  'https://www.figma.com/api/mcp/asset/f3a9a1bf-912b-4207-b222-3bdfd866cbc0',
  'https://www.figma.com/api/mcp/asset/b74016f4-9b5a-417d-96bb-21b2e2ded6f0',
  'https://www.figma.com/api/mcp/asset/17b6a7b0-8065-493f-9148-20881a45f1ba',
  'https://www.figma.com/api/mcp/asset/cb32e979-2b3f-4afc-bcbc-a6508ef69d08',
]

const FRAME_MS = 500 // 0.5s per photo
const STORAGE_KEY = 'foe_intro_seen_v1'

export default function IntroScreen({ onDismiss }) {
  const [bgIndex, setBgIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [isDismissing, setIsDismissing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  // Preload all images so the 0.2s cadence doesn't stutter
  useEffect(() => {
    BG_IMAGES.forEach((src) => {
      const img = new Image()
      img.src = src
    })
  }, [])

  // Cycle BG images on a fixed cadence (pauseable)
  useEffect(() => {
    if (isPaused) return
    const id = setInterval(() => {
      setBgIndex((i) => (i + 1) % BG_IMAGES.length)
    }, FRAME_MS)
    return () => clearInterval(id)
  }, [isPaused])

  const dismiss = () => {
    if (isDismissing) return
    setIsDismissing(true)
    // Allow exit animation to play before unmounting
    setTimeout(() => {
      onDismiss?.()
    }, 300)
  }

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    setDragX(0)
  }

  const onTouchMove = (e) => {
    if (touchStartX.current == null) return
    const dx = e.touches[0].clientX - touchStartX.current
    // Only track leftward drag for visual feedback
    if (dx < 0) setDragX(dx)
    else setDragX(0)
  }

  const onTouchEnd = () => {
    const dx = dragX
    touchStartX.current = null
    touchStartY.current = null
    const threshold = window.innerWidth * 0.18
    if (dx <= -threshold) {
      dismiss()
    } else {
      // Snap back
      setDragX(0)
    }
  }

  const translateX = isDismissing ? -window.innerWidth : dragX
  const opacity = isDismissing ? 0 : 1

  return (
    <div
      className="md:hidden fixed inset-0 z-[100] overflow-hidden select-none"
      style={{
        transform: `translateX(${translateX}px)`,
        opacity,
        transition: isDismissing
          ? 'transform 300ms ease-in, opacity 300ms ease-in'
          : (touchStartX.current == null ? 'transform 250ms ease-out' : 'none'),
        touchAction: 'pan-y',
        backgroundColor: '#000',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Cycling BG photos — all stacked, only active is visible */}
      <div className="absolute inset-0">
        {BG_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ opacity: i === bgIndex ? 1 : 0 }}
            draggable={false}
          />
        ))}
      </div>

      {/* Contrast overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Foreground: logo, copy, hand icon — pointer-events-none so taps pass through to button */}
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 pointer-events-none">
        {/* Logo — invert to white on dark bg. Fades in first. */}
        <img
          src="/logo2.svg"
          alt="FOOD OR ELSE"
          className="h-[64px] w-auto foe-fade-in foe-fade-logo"
          style={{ filter: 'brightness(0) invert(1)' }}
          draggable={false}
        />

        {/* Copy + hand swipe — paired, fade in together after the logo. */}
        <p className="mt-8 font-['Nunito'] font-bold text-white text-[20px] leading-6 text-center max-w-[240px] foe-fade-in foe-fade-subhead">
          Swipe to see what&rsquo;s worth eating near you
        </p>

        <div className="mt-6 relative w-full h-10 overflow-hidden foe-fade-in foe-fade-subhead">
          <div className="foe-hand-swipe absolute top-0 text-[#f4ff20]">
            <HandSwipeLeft size={40} weight="regular" />
          </div>
        </div>
      </div>

      {/* Pause / play toggle — bottom right, rendered last so it sits above all other layers */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsPaused((p) => !p)
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        aria-label={isPaused ? 'Resume background animation' : 'Pause background animation'}
        className="absolute bottom-6 right-6 w-10 h-10 rounded-full bg-white/15 backdrop-blur-md
          flex items-center justify-center border-none cursor-pointer text-white/90 p-0 z-10"
      >
        {isPaused
          ? <Play size={20} weight="fill" />
          : <Pause size={20} weight="fill" />}
      </button>

      <style>{`
        @keyframes foe-hand-swipe-kf {
          0%   { left: calc(100% - 56px); opacity: 0; }
          12%  { left: calc(100% - 64px); opacity: 1; }
          80%  { left: 16px; opacity: 1; }
          92%  { left: 8px; opacity: 0; }
          100% { left: 8px; opacity: 0; }
        }
        .foe-hand-swipe {
          animation: foe-hand-swipe-kf 3.2s ease-in-out infinite;
          /* Wait for the container to finish fading in, then start the loop.
             `backwards` applies the 0% keyframe (off-screen right, opacity 0)
             during the delay, preventing a flash at the default left:0. */
          animation-delay: 750ms;
          animation-fill-mode: backwards;
          will-change: left, opacity;
        }

        /* Smooth staged entrance for logo then paired subhead + hand. */
        @keyframes foe-fade-in-kf {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .foe-fade-in {
          opacity: 0;
          animation-name: foe-fade-in-kf;
          animation-duration: 500ms;
          animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
          animation-fill-mode: forwards;
        }
        .foe-fade-logo    { animation-delay: 100ms; }
        .foe-fade-subhead { animation-delay: 600ms; }
      `}</style>
    </div>
  )
}

/** Returns true if the user has already dismissed the intro. */
export function hasSeenIntro() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return true // If storage is blocked, don't show intro
  }
}
