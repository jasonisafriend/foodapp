import { useState } from 'react'

function getMapsUrl(food) {
  if (food.maps_url) return food.maps_url
  if (food.location) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.location)}`
  }
  return null
}

function LocationLink({ food, className, dark }) {
  const url = getMapsUrl(food)
  if (!food.location) return null

  const content = (
    <>
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
      </svg>
      {food.location}
    </>
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`${className} underline ${dark ? 'decoration-black/30 hover:decoration-black/60' : 'decoration-white/40 hover:decoration-white/80'} underline-offset-2 transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    )
  }

  return <span className={className}>{content}</span>
}

/** Display price as actual dollar amount */
function PriceDisplay({ price }) {
  if (price == null) return null
  const formatted = Number.isInteger(price) ? `$${price}` : `$${Number(price).toFixed(2)}`
  return <span className="opacity-80 text-[20px] font-normal">{formatted}</span>
}

/** Mobile card info — rendered below the image, matches Figma layout */
export function CardInfo({ food }) {
  if (!food) return null

  return (
    <div className="px-4 flex flex-col gap-3">
      {/* Title + price row */}
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-['Playfair_Display'] italic font-medium text-[#1f1f1f] text-[24px] leading-8 flex-1">
          {food.name}
        </h3>
        <PriceDisplay price={food.price} />
      </div>
      {/* Description */}
      {food.description && (
        <p className="text-[#1f1f1f]/90 text-[16px] leading-6 line-clamp-2">
          {food.description}
        </p>
      )}
      {/* Location */}
      {food.location && (
        <div className="flex items-center text-black/80 text-[14px]">
          <span>📍 {food.location}</span>
        </div>
      )}
    </div>
  )
}

/** Glass action style shared by bookmark + location pill */
const glassStyle = {
  backgroundColor: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

/** Bookmark icon — glass circle */
function BookmarkAction() {
  return (
    <button
      className="flex items-center justify-center w-12 h-12 rounded-full border-none cursor-pointer p-0"
      style={glassStyle}
      aria-label="Bookmark"
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
      </svg>
    </button>
  )
}

/** Go-to-location glass icon — up-right arrow that opens Google Maps */
function LocationGoAction({ food }) {
  const url = getMapsUrl(food)
  if (!food.location) return null

  const button = (
    <button
      className="flex items-center justify-center w-12 h-12 rounded-full border-none cursor-pointer p-0"
      style={glassStyle}
      aria-label={`Open ${food.location} in Maps`}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H8M17 7v9" />
      </svg>
    </button>
  )

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
        {button}
      </a>
    )
  }
  return button
}

/** Mobile full-bleed image card — no rounded corners, bookmark + go stacked at bottom-left */
export function MobileFoodImage({ food, style }) {
  return (
    <div className="w-full h-full shrink-0 relative" style={style}>
      {food.image_url ? (
        <img
          src={food.image_url}
          alt={food.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#d9d9d9]" />
      )}
      {/* Action overlays — stacked glass circles on the left, bookmark on top, go below */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-3">
        <BookmarkAction />
        <LocationGoAction food={food} />
      </div>
    </div>
  )
}

export default function FoodCard({ food }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative shrink-0 w-[392px] h-[523px] rounded-[20px] overflow-hidden cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {food.image_url ? (
        <img
          src={food.image_url}
          alt={food.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#d9d9d9]" />
      )}

      {/* Hover overlay — desktop only */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent
          flex flex-col justify-end p-6 transition-opacity duration-300
          ${hovered ? 'opacity-100' : 'opacity-0'}`}
      >
        <h3 className="font-['Playfair_Display'] italic font-medium text-white text-[32px] leading-tight mb-2">
          {food.name}
        </h3>
        {food.description && (
          <p className="text-white/90 text-sm leading-relaxed mb-3 line-clamp-3">
            {food.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-white/80 text-sm">
          <LocationLink food={food} className="flex items-center gap-1" />
          {food.price != null && (
            <span className="flex items-center gap-0.5 font-medium">
              ${food.price}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
