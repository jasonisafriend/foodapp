import { useRef, useEffect, useState } from 'react'
import FoodCard from './FoodCard'

export default function InfiniteScroll({ foods }) {
  const scrollRef = useRef(null)
  const [isPaused, setIsPaused] = useState(false)

  // We need enough cards to fill the viewport and then duplicate them
  // for the seamless infinite scroll effect
  const displayFoods = foods.length > 0 ? [...foods, ...foods, ...foods] : []

  useEffect(() => {
    const el = scrollRef.current
    if (!el || foods.length === 0) return

    let animationId
    let scrollPos = 0
    // Width of one set of cards
    const gap = 56
    const cardWidth = 392
    const singleSetWidth = foods.length * (cardWidth + gap)

    const animate = () => {
      if (!isPaused) {
        scrollPos += 0.5
        // Reset when we've scrolled one full set
        if (scrollPos >= singleSetWidth) {
          scrollPos -= singleSetWidth
        }
        el.style.transform = `translateX(-${scrollPos}px)`
      }
      animationId = requestAnimationFrame(animate)
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [foods, isPaused])

  if (foods.length === 0) {
    return (
      <div className="flex items-center justify-center h-[523px] text-neutral-500">
        <div className="text-center">
          <p className="text-xl mb-2">No food yet!</p>
          <p className="text-sm">Share something delicious to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full overflow-hidden">
      <div
        ref={scrollRef}
        className="flex gap-[56px] items-center pl-[56px] will-change-transform"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {displayFoods.map((food, index) => (
          <FoodCard key={`${food.id}-${index}`} food={food} />
        ))}
      </div>
    </div>
  )
}
