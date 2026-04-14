import { useRef, useEffect, useCallback, useState } from 'react'
import FoodCard, { MobileFoodImage, CardInfo } from './FoodCard'

export default function InfiniteScroll({ foods, onScrollProgress }) {
  const scrollRef = useRef(null)
  const scrollPos = useRef(0)
  const totalScrolled = useRef(0)

  // Mobile swipe state
  // visualIndex runs 0..N+1 over the extended track [last, ...foods, first].
  // visualIndex === 1 corresponds to foods[0]; wrapping animates past the
  // edge then silently snaps back to the real slot so a full-carousel
  // rewind looks like a single-card swipe.
  const N = foods.length
  const [visualIndex, setVisualIndex] = useState(1)
  const currentIndex = N > 0 ? ((visualIndex - 1 + N) % N) : 0
  const touchStart = useRef(null)
  const touchDelta = useRef(0)
  const mobileTrackRef = useRef(null)
  const animating = useRef(false)
  const mobileTotalSwiped = useRef(0)
  const prevFoodsLength = useRef(foods.length)

  // Reset to the first card whenever the feed list changes size (new post,
  // filter applied/cleared, etc.) so we never land on a now-missing slot.
  useEffect(() => {
    if (foods.length !== prevFoodsLength.current) {
      setVisualIndex(1)
      mobileTotalSwiped.current = 0
    }
    prevFoodsLength.current = foods.length
  }, [foods.length])

  // Extended mobile track: prepend last card, append first card for seamless wrap
  const mobileTrackFoods = N > 0 ? [foods[N - 1], ...foods, foods[0]] : []

  // Duplicate cards for seamless horizontal wrapping (desktop)
  const displayFoods = foods.length > 0 ? [...foods, ...foods, ...foods] : []

  const gap = 56
  const cardWidth = 392
  const singleSetWidth = foods.length * (cardWidth + gap)
  const colorCycleWidth = singleSetWidth || 1

  // Desktop: wheel-driven horizontal scroll
  const updatePosition = useCallback((delta) => {
    const el = scrollRef.current
    if (!el || singleSetWidth === 0) return

    scrollPos.current += delta
    totalScrolled.current += Math.abs(delta)

    if (scrollPos.current >= singleSetWidth) {
      scrollPos.current -= singleSetWidth
    } else if (scrollPos.current < 0) {
      scrollPos.current += singleSetWidth
    }
    el.style.transform = `translateX(-${scrollPos.current}px)`

    if (onScrollProgress) {
      const progress = (totalScrolled.current / colorCycleWidth) % 1
      onScrollProgress(progress)
    }
  }, [singleSetWidth, colorCycleWidth, onScrollProgress])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    if (!mq.matches) return

    const handleWheel = (e) => {
      e.preventDefault()
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX
      updatePosition(delta)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [updatePosition])

  // Mobile: report color progress based on current index
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    if (mq.matches || !onScrollProgress || foods.length === 0) return

    const progress = (mobileTotalSwiped.current / foods.length) % 1
    onScrollProgress(progress)
  }, [currentIndex, onScrollProgress, foods.length])

  // Mobile: snap track to a visual-index position
  const snapToVisual = useCallback((vIndex, animate = true) => {
    const track = mobileTrackRef.current
    if (!track) return
    const vw = window.innerWidth
    const offset = vIndex * vw
    track.style.transition = animate ? 'transform 0.5s cubic-bezier(0.22, 0.68, 0, 1.0)' : 'none'
    track.style.transform = `translateX(-${offset}px)`
  }, [])

  // Snap on visualIndex change. First render snaps without animation;
  // later, if we landed on a duplicate (0 or N+1), wait for the transition
  // to finish, then jump back to the real slot with no animation — so
  // wrap-around feels identical to a normal swipe.
  const firstRender = useRef(true)
  useEffect(() => {
    snapToVisual(visualIndex, !firstRender.current)
    firstRender.current = false
    if (N === 0) return
    if (visualIndex === 0 || visualIndex === N + 1) {
      const realIndex = visualIndex === 0 ? N : 1
      const t = setTimeout(() => {
        setVisualIndex(realIndex)
        snapToVisual(realIndex, false)
      }, 500)
      return () => clearTimeout(t)
    }
  }, [visualIndex, N, snapToVisual])

  // Snap on resize
  useEffect(() => {
    const handleResize = () => snapToVisual(visualIndex, false)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [visualIndex, snapToVisual])

  // Mobile touch handlers
  const touchStartY = useRef(null)

  const onTouchStart = useCallback((e) => {
    if (animating.current) return
    touchStart.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    touchDelta.current = 0
    const track = mobileTrackRef.current
    if (track) track.style.transition = 'none'
  }, [])

  const touchEndY = useRef(null)

  const onTouchMove = useCallback((e) => {
    if (touchStart.current === null) return
    e.preventDefault()
    touchDelta.current = e.touches[0].clientX - touchStart.current
    touchEndY.current = e.touches[0].clientY
    const track = mobileTrackRef.current
    if (!track) return
    const vw = window.innerWidth
    const offset = visualIndex * vw - touchDelta.current
    track.style.transform = `translateX(-${offset}px)`
  }, [visualIndex])

  // Helper: get Maps URL for a food item
  const getMapsUrl = useCallback((food) => {
    if (!food) return null
    if (food.maps_url) return food.maps_url
    if (food.location) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.location)}`
    }
    return null
  }, [])

  const onTouchEnd = useCallback(() => {
    if (touchStart.current === null) return
    const deltaX = touchDelta.current
    const deltaY = (touchStartY.current !== null && touchEndY.current !== null)
      ? touchStartY.current - touchEndY.current
      : 0
    const threshold = window.innerWidth * 0.12
    touchStart.current = null
    touchStartY.current = null
    touchEndY.current = null

    // Swipe up detection: vertical > horizontal and upward > 60px
    if (deltaY > 60 && Math.abs(deltaY) > Math.abs(deltaX)) {
      const food = foods[currentIndex]
      const url = getMapsUrl(food)
      if (url) {
        window.open(url, '_blank')
      }
      // Snap back to current visual position
      snapToVisual(visualIndex, true)
      return
    }

    let newVisual = visualIndex
    if (deltaX < -threshold) {
      newVisual = visualIndex + 1
    } else if (deltaX > threshold) {
      newVisual = visualIndex - 1
    }

    if (newVisual !== visualIndex) {
      mobileTotalSwiped.current += 1
    }

    animating.current = true
    setVisualIndex(newVisual)

    // Update color on swipe — slight delay so the photo settles first
    if (onScrollProgress && foods.length > 0) {
      setTimeout(() => {
        const progress = (mobileTotalSwiped.current / foods.length) % 1
        onScrollProgress(progress)
      }, 150)
    }

    // Allow next touch a bit after the silent-snap-back completes (~500+50ms)
    setTimeout(() => { animating.current = false }, 560)
  }, [visualIndex, currentIndex, foods, foods.length, onScrollProgress, getMapsUrl, snapToVisual])

  if (foods.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] md:h-[523px] text-neutral-500">
        <div className="text-center">
          <p className="text-xl mb-2">No food yet!</p>
          <p className="text-sm">Share something delicious to get started.</p>
        </div>
      </div>
    )
  }

  const activeFood = foods[currentIndex] || foods[0]

  return (
    <>
      {/* Mobile: full-screen horizontal swipe carousel */}
      {/* bottom: 72px leaves room for the MenuTray */}
      <div
        className="md:hidden fixed left-0 right-0 flex flex-col"
        style={{ top: '-200px', bottom: '-200px', paddingTop: 'calc(200px + 40px)', paddingBottom: 'calc(200px + 72px)', zIndex: 1, overscrollBehavior: 'none', touchAction: 'pan-x', backgroundColor: '#FFFFFF' }}
      >
        {/* Image area — fills available space above card info */}
        <div
          className="flex-1 overflow-hidden relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          style={{ touchAction: 'none' }}
        >
          <div
            ref={mobileTrackRef}
            className="flex h-full will-change-transform"
            style={{ width: `${mobileTrackFoods.length * 100}vw` }}
          >
            {mobileTrackFoods.map((food, i) => (
              <div
                key={`${food.id}-${i}`}
                className="h-full"
                style={{ width: '100vw', minWidth: '100vw' }}
              >
                <MobileFoodImage food={food} style={{ width: '100%', height: '100%' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Card info between photo and menu tray */}
        <div className="shrink-0 pt-3 pb-2">
          <CardInfo food={activeFood} />
        </div>
      </div>

      {/* Desktop: horizontal infinite scroll driven by wheel */}
      <div className="hidden md:block w-full overflow-hidden">
        <div
          ref={scrollRef}
          className="flex gap-[56px] items-center pl-[56px] will-change-transform"
        >
          {displayFoods.map((food, index) => (
            <FoodCard key={`${food.id}-${index}`} food={food} />
          ))}
        </div>
      </div>
    </>
  )
}
