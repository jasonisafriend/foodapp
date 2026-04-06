import { useState } from 'react'
import InfiniteScroll from './components/InfiniteScroll'
import ShareFoodModal from './components/ShareFoodModal'
import AuthModal from './components/AuthModal'
import MenuTray from './components/MenuTray'
import ProfilePage from './components/ProfilePage'
import useFoodPosts from './hooks/useFoodPosts'
import useScrollColor from './hooks/useScrollColor'
import { useAuth } from './lib/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('discover') // 'discover' | 'profile'
  const { foods, loading, addFood } = useFoodPosts()
  const { bgColor, onScrollProgress } = useScrollColor()
  const { user, signOut } = useAuth()

  const handleShareClick = () => {
    if (!isSupabaseConfigured() || user) {
      setIsModalOpen(true)
    } else {
      setIsAuthOpen(true)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    setCurrentPage('discover')
  }

  return (
    <div
      className="min-h-screen h-screen w-full overflow-hidden relative transition-colors duration-500 ease-in-out"
      style={{ backgroundColor: bgColor }}
    >
      {/* Desktop header */}
      <div className="hidden md:block px-[4%] pt-[34px] pb-0 relative">
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

      {/* Profile page overlay (mobile only) */}
      {currentPage === 'profile' && user && (
        <ProfilePage
          onBack={() => setCurrentPage('discover')}
          onSignOut={handleSignOut}
        />
      )}

      {/* Mobile bottom menu tray */}
      <MenuTray
        onAdd={handleShareClick}
        onAuth={() => setIsAuthOpen(true)}
        user={user}
        onProfile={() => setCurrentPage('profile')}
        onDiscover={() => setCurrentPage('discover')}
        currentPage={currentPage}
      />

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
