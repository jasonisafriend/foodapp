import { useState, useEffect } from 'react'
import InfiniteScroll from './components/InfiniteScroll'
import ShareFoodModal from './components/ShareFoodModal'
import AuthModal from './components/AuthModal'
import useFoodPosts from './hooks/useFoodPosts'
import useScrollColor from './hooks/useScrollColor'
import useHeaderContrast from './hooks/useHeaderContrast'
import { useAuth } from './lib/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [currentFoodIndex, setCurrentFoodIndex] = useState(0)
  const { foods, loading, addFood } = useFoodPosts()
  const { bgColor, onScrollProgress } = useScrollColor()
  const { user, signOut } = useAuth()

  // Determine header contrast from current mobile card image
  const currentFood = foods[currentFoodIndex]
  const headerIsDark = useHeaderContrast(currentFood?.image_url)
  const headerColor = headerIsDark ? 'white' : 'black'

  // Lock ALL vertical scroll on mobile (html + body)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    if (!mq.matches) return

    const html = document.documentElement
    const body = document.body
    html.style.overflow = 'hidden'
    html.style.height = '100%'
    body.style.overflow = 'hidden'
    body.style.height = '100%'
    body.style.position = 'fixed'
    body.style.width = '100%'
    body.style.top = '0'
    body.style.left = '0'

    // Prevent any residual touchmove on body
    const prevent = (e) => e.preventDefault()
    body.addEventListener('touchmove', prevent, { passive: false })

    return () => {
      html.style.overflow = ''
      html.style.height = ''
      body.style.overflow = ''
      body.style.height = ''
      body.style.position = ''
      body.style.width = ''
      body.style.top = ''
      body.style.left = ''
      body.removeEventListener('touchmove', prevent)
    }
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      return () => {
        document.body.style.position = 'fixed'
        document.body.style.top = '0'
        document.body.style.left = '0'
        document.body.style.right = ''
      }
    }
  }, [isMenuOpen])

  const handleShareClick = () => {
    if (!isSupabaseConfigured() || user) {
      setIsModalOpen(true)
    } else {
      setIsAuthOpen(true)
    }
  }

  return (
    <div
      className="min-h-screen w-full overflow-hidden relative transition-colors duration-300 ease-out"
      style={{ backgroundColor: bgColor }}
    >
      {/* Header — floats over content on mobile */}
      <div className="px-[4%] pt-[34px] pb-0 relative z-40 md:z-auto">
        {/* Mobile: hamburger menu button — top right, dynamic contrast */}
        <button
          onClick={() => setIsMenuOpen(true)}
          className="md:hidden absolute right-[4%] top-[34px] z-20
            bg-transparent border-none cursor-pointer p-1 transition-colors duration-300"
          aria-label="Open menu"
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={headerColor} strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop: Sign In top-right, Share Food bottom-right of headline */}
        <div className="hidden md:flex flex-col justify-between items-end absolute right-[4%] top-[34px] bottom-0 z-10">
          {user ? (
            <button
              onClick={signOut}
              className="text-[16px] text-black underline underline-offset-2
                bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
            >
              Sign out
            </button>
          ) : (
            <button
              onClick={() => setIsAuthOpen(true)}
              className="text-[16px] text-black underline underline-offset-2
                bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
            >
              Sign in
            </button>
          )}
          <button
            onClick={handleShareClick}
            className="flex items-center gap-2.5 h-[44px] px-4 bg-black rounded-full
              text-white text-xl cursor-pointer border-none
              hover:bg-gray-800 transition-colors"
          >
            Share Food
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <img
          src="/logo2.svg"
          alt="FOOD OR ELSE"
          className="h-[50px] sm:h-[70px] md:h-[90px] lg:h-[112px] w-auto pr-[52px] md:pr-0 transition-[filter] duration-300"
          style={headerIsDark ? { filter: 'brightness(0) invert(1)' } : {}}
        />
      </div>

      {/* Mobile full-screen menu overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {/* Close button — top right */}
          <div className="flex justify-end px-[4%] pt-[34px]">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="bg-transparent border-none cursor-pointer p-1"
              aria-label="Close menu"
            >
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Menu items */}
          <div className="flex flex-col items-center justify-center flex-1 gap-8">
            {user ? (
              <button
                onClick={() => { signOut(); setIsMenuOpen(false) }}
                className="text-[24px] text-black underline underline-offset-4
                  bg-transparent border-none cursor-pointer"
              >
                Sign out
              </button>
            ) : (
              <button
                onClick={() => { setIsAuthOpen(true); setIsMenuOpen(false) }}
                className="text-[24px] text-black underline underline-offset-4
                  bg-transparent border-none cursor-pointer"
              >
                Sign in
              </button>
            )}
            <button
              onClick={() => { handleShareClick(); setIsMenuOpen(false) }}
              className="flex items-center gap-2.5 h-[52px] px-6 bg-black rounded-full
                text-white text-xl cursor-pointer border-none"
            >
              Share Food
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Food cards — on mobile the carousel is fixed/full-screen, on desktop flows normally */}
      <div className="mt-0 md:mt-[56px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] md:h-[523px]">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <InfiniteScroll foods={foods} onScrollProgress={onScrollProgress} onIndexChange={setCurrentFoodIndex} />
        )}
      </div>

      {/* Auth Modal */}
      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} />
      )}

      {/* Share Food Modal */}
      <ShareFoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addFood}
      />
    </div>
  )
}
