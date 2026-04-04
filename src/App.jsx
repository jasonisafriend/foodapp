import { useState, useEffect } from 'react'
import InfiniteScroll from './components/InfiniteScroll'
import ShareFoodModal from './components/ShareFoodModal'
import AuthModal from './components/AuthModal'
import useFoodPosts from './hooks/useFoodPosts'
import useScrollColor from './hooks/useScrollColor'
import { useAuth } from './lib/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { foods, loading, addFood } = useFoodPosts()
  const { bgColor, onScrollProgress } = useScrollColor()
  const { user, signOut } = useAuth()

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      return () => {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        window.scrollTo(0, scrollY)
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
      className="min-h-screen h-screen w-full overflow-hidden relative transition-colors duration-500 ease-in-out"
      style={{ backgroundColor: bgColor }}
    >
      {/* Mobile header — black bar with upward bleed for browser chrome */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40">
        {/* Black bleed above the bar — covers browser chrome / notch area */}
        <div className="bg-black" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
          <div className="flex items-center justify-between px-4 py-2">
            <img
              src="/logo2.svg"
              alt="FOOD OR ELSE"
              className="h-[24px] w-auto"
              style={{ filter: 'brightness(0) invert(1)' }}
            />
            <button
              onClick={() => setIsMenuOpen(true)}
              className="bg-transparent border-none cursor-pointer p-0"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop header */}
      <div className="hidden md:block px-[4%] pt-[34px] pb-0 relative">
        {/* Desktop: Sign In top-right, Share Food bottom-right of headline */}
        <div className="flex flex-col justify-between items-end absolute right-[4%] top-[34px] bottom-0 z-10">
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
          className="h-[90px] lg:h-[112px] w-auto"
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
          <InfiniteScroll foods={foods} onScrollProgress={onScrollProgress} />
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
