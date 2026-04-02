import { useState } from 'react'

export default function FoodCard({ food }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="relative shrink-0 w-[300px] h-[400px] md:w-[392px] md:h-[523px] rounded-[20px] overflow-hidden cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Image */}
      {food.image_url ? (
        <img
          src={food.image_url}
          alt={food.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-[#d9d9d9]" />
      )}

      {/* Hover overlay with all details */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent
          flex flex-col justify-end p-6 transition-opacity duration-300
          ${hovered ? 'opacity-100' : 'opacity-0'}`}
      >
        <h3 className="font-['Playfair_Display'] italic font-medium text-white text-2xl md:text-[32px] leading-tight mb-2">
          {food.name}
        </h3>
        {food.description && (
          <p className="text-white/90 text-sm leading-relaxed mb-3 line-clamp-3">
            {food.description}
          </p>
        )}
        <div className="flex items-center gap-4 text-white/80 text-sm">
          {food.location && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              {food.location}
            </span>
          )}
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
