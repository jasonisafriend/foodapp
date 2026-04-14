import { useState } from 'react'

function SearchIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15Z" />
    </svg>
  )
}

/** Mobile top bar — search, Near Me/New chips, Tags link. UI-only for now. */
export default function TopBar() {
  const [activeChip, setActiveChip] = useState('near') // 'near' | 'new'
  const [tagsOpen, setTagsOpen] = useState(false)

  const tags = [
    '#pizza',
    '#chinese',
    '#mexican',
    '#japanese',
    '#korean',
    '#italian',
    '#sandwich',
    '#burger',
    '#tacos',
    '#bbq',
    '#thai',
    '#vietnamese',
    '#indian',
    '#halal',
    '#bakery',
    '#dessert',
    '#coffee',
    '#breakfast',
    '#seafood',
    '#salad',
  ]

  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 h-10 bg-white flex items-center justify-between px-4 py-2.5 z-20">
        {/* Search icon */}
        <button
          aria-label="Search"
          className="border-none bg-transparent p-0 cursor-pointer flex items-center justify-center"
        >
          <SearchIcon />
        </button>

        {/* Segmented control: Near Me / New */}
        <div className="flex gap-3 items-center">
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

        {/* Tags link */}
        <button
          onClick={() => setTagsOpen(true)}
          className="bg-transparent border-none cursor-pointer p-0 font-['Nunito'] font-normal text-[14px] leading-5 text-[#1f1f1f]"
        >
          Tags
        </button>
      </div>

      {/* Tags bottom sheet — UI only */}
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
              <h3 className="font-['Playfair_Display'] italic font-medium text-[22px] text-[#1f1f1f]">
                Browse by tag
              </h3>
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
            <div className="flex flex-wrap gap-2 pb-4">
              {tags.map((tag) => (
                <button
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-[#f5f5f5] text-[#1f1f1f] text-[14px] font-['Nunito'] border-none cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
