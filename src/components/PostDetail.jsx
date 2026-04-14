import { useState, useEffect, useRef } from 'react'
import { ArrowBendRightUp, ArrowLeft, Pencil } from '@phosphor-icons/react'
import TagPicker from './TagPicker'
import { sanitizeTags, withHash } from '../lib/tags'

/** Glass style shared with FoodCard actions */
const glassStyle = {
  backgroundColor: 'rgba(255,255,255,0.55)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
}

function getMapsUrl(food) {
  if (!food) return null
  if (food.maps_url) return food.maps_url
  if (food.location) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(food.location)}`
  }
  return null
}

/**
 * Detail view for a food post, opened from Profile.
 *
 * Props:
 *   food       — the post object
 *   editable   — show Edit button + allow entering edit mode (Recent Eats)
 *   deletable  — show Delete link at bottom (Recent Eats)
 *   onBack     — dismiss the view
 *   onSave     — async (patch) => updated post; called from edit-mode Save
 *   onDelete   — async () => void; called after native confirm
 */
export default function PostDetail({ food, editable, deletable, onBack, onSave, onDelete }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState(null)

  // Editable field state — seeded from food, reset when food changes
  const [name, setName] = useState(food?.name || '')
  const [description, setDescription] = useState(food?.description || '')
  const [location, setLocation] = useState(food?.location || '')
  const [price, setPrice] = useState(food?.price != null ? String(food.price) : '')
  const [mapsUrl, setMapsUrl] = useState(food?.maps_url || '')
  const [showMapsField, setShowMapsField] = useState(!!food?.maps_url)
  const [tags, setTags] = useState(sanitizeTags(food?.tags))

  const nameRef = useRef(null)

  // Reseed when the food prop changes (e.g. opened for a different post)
  useEffect(() => {
    setName(food?.name || '')
    setDescription(food?.description || '')
    setLocation(food?.location || '')
    setPrice(food?.price != null ? String(food.price) : '')
    setMapsUrl(food?.maps_url || '')
    setShowMapsField(!!food?.maps_url)
    setTags(sanitizeTags(food?.tags))
    setIsEditing(false)
    setError(null)
  }, [food?.id])

  // Auto-resize name textarea
  useEffect(() => {
    const el = nameRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
  }, [name, isEditing])

  // Lock body scroll while open
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])

  if (!food) return null

  const origTags = sanitizeTags(food.tags)
  const tagsChanged =
    tags.length !== origTags.length ||
    tags.some((t, i) => t !== origTags[i])

  const isDirty =
    name !== (food.name || '') ||
    description !== (food.description || '') ||
    location !== (food.location || '') ||
    price !== (food.price != null ? String(food.price) : '') ||
    mapsUrl !== (food.maps_url || '') ||
    tagsChanged

  const handleBack = () => {
    if (isEditing && isDirty) {
      const ok = window.confirm('Discard changes?')
      if (!ok) return
    }
    onBack?.()
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const patch = {
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        price: price === '' ? null : Number(price),
        maps_url: mapsUrl.trim() || null,
        tags: sanitizeTags(tags),
      }
      await onSave?.(patch)
      setIsEditing(false)
    } catch (err) {
      setError(err.message || 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    const ok = window.confirm('Delete this post? This cannot be undone.')
    if (!ok) return
    setIsDeleting(true)
    try {
      await onDelete?.()
    } catch (err) {
      setError(err.message || 'Failed to delete')
      setIsDeleting(false)
    }
  }

  const mapsHref = getMapsUrl(food)

  return (
    <>
    <div className="md:hidden fixed inset-0 z-40 bg-white overflow-y-auto overscroll-contain">
      {/* Photo — scrolls with the page */}
      <div className="relative w-full" style={{ aspectRatio: '4 / 5' }}>
        {food.image_url ? (
          <img
            src={food.image_url}
            alt={food.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-[#d9d9d9]" />
        )}

        {/* Bookmarked-view actions (stacked glass circles) — only when !editable */}
        {!editable && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-3">
            <button
              className="flex items-center justify-center w-12 h-12 rounded-full border-none cursor-pointer p-0"
              style={glassStyle}
              aria-label="Bookmark"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
              </svg>
            </button>
            {food.location && (
              mapsHref ? (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-12 h-12 rounded-full border-none cursor-pointer p-0"
                  style={glassStyle}
                  aria-label={`Open ${food.location} in Maps`}
                >
                  <ArrowBendRightUp size={24} weight="regular" color="black" />
                </a>
              ) : (
                <button
                  className="flex items-center justify-center w-12 h-12 rounded-full border-none cursor-pointer p-0"
                  style={glassStyle}
                  aria-label={`Open ${food.location} in Maps`}
                >
                  <ArrowBendRightUp size={24} weight="regular" color="black" />
                </button>
              )
            )}
          </div>
        )}
      </div>

      {/* Info / edit area — flows below photo in the same scroll container */}
      <div>
        {error && (
          <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 m-0">{error}</p>
          </div>
        )}

        {!isEditing ? (
          <div className="px-4 pt-4 pb-28 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-['Playfair_Display'] italic font-medium text-[#1f1f1f] text-[28px] leading-8 flex-1 m-0">
                {food.name}
              </h3>
              {food.price != null && (
                <span className="opacity-80 text-[20px] font-normal">
                  {Number.isInteger(food.price) ? `$${food.price}` : `$${Number(food.price).toFixed(2)}`}
                </span>
              )}
            </div>
            {food.description && (
              <p className="text-[#1f1f1f]/90 text-[16px] leading-6 m-0">
                {food.description}
              </p>
            )}
            {food.location && (
              <div className="flex items-center text-black/80 text-[14px]">
                <span>📍 {food.location}</span>
              </div>
            )}

            {Array.isArray(food.tags) && food.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {sanitizeTags(food.tags).map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-full bg-[#f5f5f5] text-[#1f1f1f] text-[13px] font-['Nunito']"
                  >
                    {withHash(tag)}
                  </span>
                ))}
              </div>
            )}

            {/* Delete link — only when deletable */}
            {deletable && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="mt-6 self-center text-[14px] text-red-500 underline underline-offset-2
                  bg-transparent border-none cursor-pointer p-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete post'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4 px-4 py-4 pb-28">
            {/* WHAT IS IT? */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center">
                <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">WHAT IS IT?</label>
                <span className="text-sm text-black font-['Inter']">{name.length}/50</span>
              </div>
              <div className="p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
                <textarea
                  ref={nameRef}
                  value={name}
                  onChange={(e) => { if (e.target.value.length <= 50) setName(e.target.value) }}
                  placeholder="Food"
                  rows={1}
                  className="w-full font-['Playfair_Display'] italic font-medium text-[28px] leading-[36px]
                    text-[#1f1f1f] placeholder:text-[#78788f]
                    border-none outline-none bg-transparent resize-none overflow-hidden"
                  style={{ fontSize: '28px' }}
                />
              </div>
            </div>

            {/* SAY SOMETHING QUICK */}
            <div className="flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center">
                <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">SAY SOMETHING QUICK</label>
                <span className="text-sm text-black font-['Inter']">{description.length}/120</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => { if (e.target.value.length <= 120) setDescription(e.target.value) }}
                placeholder="Crispy crust, gooey mozzarella, fresh basil, and perfect sauce. 10/10"
                className="w-full h-[80px] p-4 border-[1.5px] border-dashed border-[#bebdd5]
                  rounded-lg text-[14px] text-[#23232e] placeholder:text-[#737377]
                  resize-none outline-none bg-white font-['Inter']"
                style={{ fontSize: '16px' }}
              />
            </div>

            {/* WHERE'S IT FROM? */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">WHERE'S IT FROM?</label>
              <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
                <svg className="w-6 h-6 shrink-0 text-[#23232e]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Search for a place"
                  className="flex-1 text-[14px] text-[#23232e] placeholder:text-[#78788f]
                    border-none outline-none bg-transparent font-['Inter']"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* Google Maps link (optional) */}
            {!showMapsField ? (
              <button
                onClick={() => setShowMapsField(true)}
                className="flex items-center gap-1.5 text-sm text-[#78788f]
                  bg-transparent border-none cursor-pointer hover:text-[#23232e]
                  transition-colors p-0 self-start -mt-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                Add Google Maps link
              </button>
            ) : (
              <div className="flex flex-col gap-2 w-full -mt-2">
                <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">
                  GOOGLE MAPS LINK <span className="text-[#78788f] font-normal">(optional)</span>
                </label>
                <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
                  <svg className="w-5 h-5 shrink-0 text-[#23232e]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
                  </svg>
                  <input
                    type="url"
                    value={mapsUrl}
                    onChange={(e) => setMapsUrl(e.target.value)}
                    placeholder="Paste Google Maps share link"
                    className="flex-1 text-[14px] text-[#23232e] placeholder:text-[#78788f]
                      border-none outline-none bg-transparent font-['Inter']"
                    style={{ fontSize: '16px' }}
                  />
                </div>
              </div>
            )}

            {/* HOW MUCH DID YOU SPEND? */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">HOW MUCH DID YOU SPEND?</label>
              <div className="flex items-center gap-2.5 p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
                <svg className="w-6 h-6 shrink-0 text-[#23232e]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
                </svg>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="5"
                  className="flex-1 text-[14px] text-[#23232e] placeholder:text-[#78788f]
                    border-none outline-none bg-transparent font-['Inter']
                    [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            {/* TAGS (OPTIONAL) */}
            <div className="flex flex-col gap-2 w-full">
              <label className="text-sm text-[#23232e] font-['Inter'] tracking-wide">
                TAGS <span className="text-[#78788f] font-normal">(optional)</span>
              </label>
              <TagPicker value={tags} onChange={setTags} />
            </div>

            {/* Delete at the very bottom — also available in edit mode for convenience */}
            {deletable && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="mt-4 self-center text-[14px] text-red-500 underline underline-offset-2
                  bg-transparent border-none cursor-pointer p-2 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting…' : 'Delete post'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Fixed top action buttons — sit above the scrolling content */}
    <div
      className="md:hidden fixed left-0 right-0 z-50 flex items-start justify-between px-4 pointer-events-none"
      style={{ top: 'max(16px, env(safe-area-inset-top, 16px))' }}
    >
      <button
        onClick={handleBack}
        aria-label="Back"
        className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full border-none cursor-pointer p-0"
        style={glassStyle}
      >
        <ArrowLeft size={24} weight="regular" color="black" />
      </button>

      {editable && !isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          aria-label="Edit post"
          className="pointer-events-auto flex items-center justify-center w-12 h-12 rounded-full border-none cursor-pointer p-0"
          style={glassStyle}
        >
          <Pencil size={22} weight="regular" color="black" />
        </button>
      )}

      {editable && isEditing && (
        <button
          onClick={handleSave}
          disabled={isSaving || !name.trim()}
          className="pointer-events-auto h-12 px-5 rounded-full border-none cursor-pointer
            bg-black text-white font-['Inter'] text-sm font-semibold
            disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
      )}
    </div>
    </>
  )
}
