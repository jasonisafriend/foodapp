import { useState, useRef, useCallback, useEffect } from 'react'

/**
 * Touch/mouse-friendly image cropper that lets users pan and pinch-zoom
 * a photo into a 400:500 (4:5) aspect ratio frame.
 *
 * Returns a cropped JPEG blob via onCrop(blob, previewUrl).
 */
const ASPECT = 4 / 5 // width / height

export default function ImageCropper({ imageSrc, onCrop, onBack }) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)

  // Transform state
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [minScale, setMinScale] = useState(1)

  // Drag state
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startTx: 0, startTy: 0 })
  // Pinch state
  const pinchRef = useRef({ active: false, startDist: 0, startScale: 1 })

  // Frame dimensions (computed from container)
  const [frame, setFrame] = useState({ w: 0, h: 0, offsetX: 0, offsetY: 0 })

  // Compute frame size once container mounts
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height

    let fw, fh
    if (cw / ch > ASPECT) {
      // Container is wider than 4:5 — height-limited
      fh = ch
      fw = fh * ASPECT
    } else {
      fw = cw
      fh = fw / ASPECT
    }
    setFrame({ w: fw, h: fh, offsetX: (cw - fw) / 2, offsetY: (ch - fh) / 2 })
  }, [imageSrc])

  // When image loads, compute the minimum scale so the image covers the frame
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current
    if (!img || !frame.w) return
    const iw = img.naturalWidth
    const ih = img.naturalHeight

    const scaleToFitW = frame.w / iw
    const scaleToFitH = frame.h / ih
    const coverScale = Math.max(scaleToFitW, scaleToFitH)

    setMinScale(coverScale)
    setScale(coverScale)
    setTranslate({ x: 0, y: 0 })
  }, [frame])

  // Re-calc when frame changes
  useEffect(() => {
    if (imgRef.current?.naturalWidth) handleImageLoad()
  }, [frame, handleImageLoad])

  // Clamp translate so image always covers the frame
  const clampTranslate = useCallback((tx, ty, s) => {
    const img = imgRef.current
    if (!img) return { x: tx, y: ty }

    const iw = img.naturalWidth * s
    const ih = img.naturalHeight * s

    const maxX = Math.max(0, (iw - frame.w) / 2)
    const maxY = Math.max(0, (ih - frame.h) / 2)

    return {
      x: Math.min(maxX, Math.max(-maxX, tx)),
      y: Math.min(maxY, Math.max(-maxY, ty)),
    }
  }, [frame])

  // ---- Touch handlers ----
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0]
      dragRef.current = { active: true, startX: t.clientX, startY: t.clientY, startTx: translate.x, startTy: translate.y }
    } else if (e.touches.length === 2) {
      dragRef.current.active = false
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      pinchRef.current = { active: true, startDist: Math.hypot(dx, dy), startScale: scale }
    }
  }

  const handleTouchMove = (e) => {
    e.preventDefault()
    if (dragRef.current.active && e.touches.length === 1) {
      const t = e.touches[0]
      const dx = t.clientX - dragRef.current.startX
      const dy = t.clientY - dragRef.current.startY
      const clamped = clampTranslate(dragRef.current.startTx + dx, dragRef.current.startTy + dy, scale)
      setTranslate(clamped)
    } else if (pinchRef.current.active && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.hypot(dx, dy)
      const newScale = Math.max(minScale, Math.min(minScale * 4, pinchRef.current.startScale * (dist / pinchRef.current.startDist)))
      setScale(newScale)
      setTranslate(prev => clampTranslate(prev.x, prev.y, newScale))
    }
  }

  const handleTouchEnd = () => {
    dragRef.current.active = false
    pinchRef.current.active = false
  }

  // ---- Mouse handlers (desktop) ----
  const handleMouseDown = (e) => {
    e.preventDefault()
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startTx: translate.x, startTy: translate.y }
    const onMove = (ev) => {
      const dx = ev.clientX - dragRef.current.startX
      const dy = ev.clientY - dragRef.current.startY
      const clamped = clampTranslate(dragRef.current.startTx + dx, dragRef.current.startTy + dy, scale)
      setTranslate(clamped)
    }
    const onUp = () => {
      dragRef.current.active = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleWheel = (e) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.95 : 1.05
    const newScale = Math.max(minScale, Math.min(minScale * 4, scale * delta))
    setScale(newScale)
    setTranslate(prev => clampTranslate(prev.x, prev.y, newScale))
  }

  // ---- Crop to canvas and return ----
  const handleConfirm = () => {
    const img = imgRef.current
    if (!img) return

    const outputW = 800
    const outputH = 1000 // 4:5

    const canvas = document.createElement('canvas')
    canvas.width = outputW
    canvas.height = outputH
    const ctx = canvas.getContext('2d')

    // Map frame coords back to source image coords
    const iw = img.naturalWidth
    const ih = img.naturalHeight

    // Center of image in frame-space at current transform
    const imgDisplayW = iw * scale
    const imgDisplayH = ih * scale
    const imgLeft = (frame.w - imgDisplayW) / 2 + translate.x
    const imgTop = (frame.h - imgDisplayH) / 2 + translate.y

    // The visible crop area in image-display-space
    const cropLeft = -imgLeft
    const cropTop = -imgTop

    // Convert from display-space to source pixel-space
    const srcX = cropLeft / scale
    const srcY = cropTop / scale
    const srcW = frame.w / scale
    const srcH = frame.h / scale

    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outputW, outputH)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        const url = canvas.toDataURL('image/jpeg', 0.9)
        onCrop(blob, url)
      },
      'image/jpeg',
      0.9,
    )
  }

  // Zoom slider value: 0 → 1
  const zoomValue = minScale > 0 ? (scale - minScale) / (minScale * 3) : 0

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center px-4 py-4">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer"
          style={{ backgroundColor: 'rgba(245,245,245,0.8)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      </div>

      <p className="text-center text-[32px] font-bold font-['Arial'] leading-[40px] text-[#1f1f1f] px-4 pb-4">
        Adjust photo
      </p>

      {/* Crop area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4">
        <div
          ref={containerRef}
          className="relative w-full overflow-hidden rounded-[20px] bg-gray-100 cursor-grab active:cursor-grabbing"
          style={{ aspectRatio: '4 / 5', maxHeight: '60vh', border: '1px solid #f4ff20' }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onWheel={handleWheel}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop preview"
            onLoad={handleImageLoad}
            draggable={false}
            className="absolute select-none"
            style={{
              width: imgRef.current ? imgRef.current.naturalWidth * scale : 'auto',
              height: imgRef.current ? imgRef.current.naturalHeight * scale : 'auto',
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${translate.x}px), calc(-50% + ${translate.y}px))`,
              maxWidth: 'none',
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3 w-full max-w-[300px]">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM13.5 10.5h-6" />
          </svg>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={zoomValue}
            onChange={(e) => {
              const v = parseFloat(e.target.value)
              const newScale = minScale + v * minScale * 3
              setScale(newScale)
              setTranslate(prev => clampTranslate(prev.x, prev.y, newScale))
            }}
            className="flex-1 accent-black h-1"
          />
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607ZM10.5 7.5v6m3-3h-6" />
          </svg>
        </div>
      </div>

      {/* Confirm button */}
      <div className="px-4 pb-6 pt-4 flex justify-center"
        style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom, 24px))' }}
      >
        <button
          onClick={handleConfirm}
          className="flex items-center gap-2.5 h-[44px] px-6 bg-black rounded-full
            text-white text-xl cursor-pointer border-none
            hover:bg-gray-800 transition-colors"
          style={{ boxShadow: '0px 4px 4px rgba(0,0,0,0.25)' }}
        >
          Continue
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
