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

/** Mobile card info — rendered separately below the image */
export function CardInfo({ food }) {
  if (!food) return null

  return (
    <div className="px-6 flex flex-col gap-2">
      <h3 className="font-['Playfair_Display'] italic font-semibold text-black text-[32px] leading-tight">
        {food.name}
      </h3>
      {food.description && (
        <p className="text-black/70 text-sm leading-relaxed line-clamp-3">
          {food.description}
        </p>
      )}
      <div className="flex items-center gap-4 text-black/60 text-sm">
        <LocationLink food={food} className="flex items-center gap-1" dark />
        {food.price != null && (
          <span className="flex items-center gap-0.5 font-medium">
            ${food.price}
          </span>
        )}
      </div>
    </div>
  )
}

/** Mobile full-bleed image card — no rounded corners, no overlay */
export function MobileFoodImage({ food, style }) {
  return (
    <div className="w-full h-full shrink-0" style={style}>
      {food.image_url ? (
        <img
          src={food.image_url}
          alt={food.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#d9d9d9]" />
      )}
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
