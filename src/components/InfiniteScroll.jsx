import { useRef, useEffect, useCallback } from 'react'
import FoodCard from './FoodCard'

export default function InfiniteScroll({ foods }) {
  const scrollRef = useRef(null)
  const scrollPos = useRef(0)

  // Duplicate cards for seamless horizontal wrapping (desktop only)
  const displayFoods = foods.length > 0 ? [...foods, ...foods, ...foods] : []

  const gap = 56
  const cardWidth = 392
  const singleSetWidth = foods.length * (cardWidth + gap)

  const updatePosition = useCallback((delta) => {
    const el = scrollRef.current
    if (!el || singleSetWidth === 0) return

    scrollPos.current += delta
    if (scrollPos.current >= singleSetWidth) {
      scrollPos.current -= singleSetWidth
    } else if (scrollPos.current < 0) {
      scrollPos.current += singleSetWidth
    }
    el.style.transform = `translateX(-${scrollPos.current}px)`
  }, [singleSetWidth])

  useEffect(() => {
    // Only hijack wheel on desktop (md breakpoint = 768px)
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

  return (
    <>
      {/* Mobile: vertical stack, normal scroll */}
      <div className="flex flex-col gap-5 px-4 pb-28 md:hidden">
        {foods.map((food) => (
          <FoodCard key={food.id} food={food} mobile />
        ))}
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
