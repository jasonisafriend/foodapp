import { useState, useRef, useEffect } from 'react'
import { suggestTags, withHash, isValidTag } from '../lib/tags'

/**
 * Optional multi-tag picker. Only tags from the canonical list can be added.
 *
 * Props:
 *   value    — string[] of currently selected tag slugs (without `#`)
 *   onChange — (tags: string[]) => void
 */
export default function TagPicker({ value = [], onChange }) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef(null)

  // Close suggestions when clicking outside
  useEffect(() => {
    const onDown = (e) => {
      if (!wrapRef.current?.contains(e.target)) setFocused(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
    }
  }, [])

  const addTag = (tag) => {
    if (!isValidTag(tag) || value.includes(tag)) return
    onChange?.([...value, tag])
    setQuery('')
  }

  const removeTag = (tag) => {
    onChange?.(value.filter((t) => t !== tag))
  }

  const suggestions = suggestTags(query, { exclude: value })
  const showSuggestions = focused && suggestions.length > 0

  return (
    <div className="relative" ref={wrapRef}>
      <div className="flex flex-wrap items-center gap-2 p-4 border-[1.5px] border-dashed border-[#bebdd5] rounded-lg bg-white">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f5f5f5] text-[#1f1f1f] text-[14px] font-['Nunito']"
          >
            {withHash(tag)}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className="w-4 h-4 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer p-0 text-[#78788f]"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.replace(/^#+/, ''))}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              // Commit only if exact match in suggestions
              const q = query.trim().toLowerCase().replace(/^#+/, '')
              if (isValidTag(q)) addTag(q)
              else if (suggestions.length === 1) addTag(suggestions[0])
            } else if (e.key === 'Backspace' && !query && value.length > 0) {
              removeTag(value[value.length - 1])
            }
          }}
          placeholder={value.length === 0 ? 'Start typing a tag…' : ''}
          className="flex-1 min-w-[120px] text-[14px] text-[#23232e] placeholder:text-[#78788f]
            border-none outline-none bg-transparent font-['Inter']"
          style={{ fontSize: '16px' }}
        />
      </div>

      {/* Autocomplete dropdown */}
      {showSuggestions && (
        <div
          className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-lg bg-white
            shadow-lg border border-[#e5e5ea] z-10"
        >
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => {
                // onMouseDown fires before onBlur, so the click lands
                e.preventDefault()
                addTag(tag)
              }}
              className="w-full text-left px-4 py-2.5 text-[14px] font-['Nunito'] text-[#1f1f1f]
                bg-transparent border-none cursor-pointer hover:bg-[#f5f5f5]"
            >
              {withHash(tag)}
            </button>
          ))}
        </div>
      )}

      {query && !isValidTag(query.trim().toLowerCase()) && suggestions.length === 0 && (
        <p className="text-xs text-[#78788f] mt-1.5 font-['Inter']">
          No matching tag. Tags are limited to the existing list.
        </p>
      )}
    </div>
  )
}
