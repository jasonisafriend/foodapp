import { useState } from 'react'
import { FOOD_TAGS, withHash } from '../lib/tags'

function SearchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" />
    </svg>
  )
}

/**
 * Mobile top bar — search, Near Me/New chips, Tags menu with filter.
 *
 * Props:
 *   selectedTag   — currently-selected tag slug (no `#`) or null
 *   onSelectTag   — (tag: string | null) => void
 */
export default function TopBar({ selectedTag = null, onSelectTag }) {
  const [activeChip, setActiveChip] = useState('near') // 'near' | 'new'
  const [tagsOpen, setTagsOpen] = useState(false)

  const pickTag = (tag) => {
    onSelectTag?.(tag)
    setTagsOpen(false)
  }

  const clearTag = () => {
    onSelectTag?.(null)
    setTagsOpen(false)
  }

  return (
    <>
      <div
        className="md:hidden fixed top-0 left-0 right-0 h-10 bg-white grid items-center px-4 py-2.5 z-20"
        style={{ gridTemplateColumns: '1fr auto 1fr' }}
      >
        {/* Search icon — disabled placeholder until search is wired up */}
        <button
          aria-label="Search (coming soon)"
          disabled
          className="justify-self-start border-none bg-transparent p-0 cursor-not-allowed flex items-center justify-center opacity-20"
        >
          <SearchIcon />
        </button>

        {/* Segmented control: Near Me / New — always centered */}
        <div className="flex gap-3 items-center justify-self-center">
          <button
            onClick={() => setActiveChip('near')}
            className={`min-w-12 px-3 py-1 rounded-[20px] border-none cursor-pointer text-[14px] leading-5 whitespace-nowrap transition-colors ${
              activeChip === 'near'
                ? "bg-black text-white font-['Nunito'] font-bold"
                : "bg-white text-[#1f1f1f] font-['Nunito'] font-normal"
            }`}
          >
            Near Me
          </button>
          <button
            onClick={() => setActiveChip('new')}
            className={`min-w-12 px-3 py-1 rounded-[20px] border-none cursor-pointer text-[14px] leading-5 whitespace-nowrap transition-colors ${
              activeChip === 'new'
                ? "bg-black text-white font-['Nunito'] font-bold"
                : "bg-white text-[#1f1f1f] font-['Nunito'] font-normal"
            }`}
          >
            New
          </button>
        </div>

        {/* Tags link — shows selected tag when active */}
        <button
          onClick={() => setTagsOpen(true)}
          className={`justify-self-end bg-transparent border-none cursor-pointer p-0 font-['Nunito'] text-[14px] leading-5 whitespace-nowrap ${
            selectedTag ? 'text-black font-bold' : 'text-[#1f1f1f] font-normal'
          }`}
        >
          {selectedTag ? withHash(selectedTag) : 'Tags'}
        </button>
      </div>

      {/* Tags bottom sheet */}
      {tagsOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end bg-black/40"
          onClick={() => setTagsOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-5 max-h-[70vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Playfair_Display'] italic font-medium text-[22px] text-[#1f1f1f] m-0">
                Browse by tag
              </h3>
              <div className="flex items-center gap-3">
                {selectedTag && (
                  <button
                    onClick={clearTag}
                    className="text-[13px] font-['Inter'] text-[#1f1f1f] underline underline-offset-2
                      bg-transparent border-none cursor-pointer p-0"
                  >
                    Clear filter
                  </button>
                )}
                <button
                  onClick={() => setTagsOpen(false)}
                  aria-label="Close"
                  className="bg-transparent border-none cursor-pointer p-1"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={1.75}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {selectedTag && (
              <p className="text-[13px] text-[#78788f] font-['Inter'] -mt-2 mb-3">
                Filtering by {withHash(selectedTag)}. Tap another tag to switch.
              </p>
            )}

            <div className="flex flex-wrap gap-2 pb-4">
              {FOOD_TAGS.map((tag) => {
                const active = tag === selectedTag
                return (
                  <button
                    key={tag}
                    onClick={() => pickTag(tag)}
                    className={`px-3 py-1.5 rounded-full text-[14px] font-['Nunito'] border-none cursor-pointer transition-colors ${
                      active
                        ? 'bg-black text-white font-bold'
                        : 'bg-[#f5f5f5] text-[#1f1f1f] font-normal'
                    }`}
                  >
                    {withHash(tag)}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
