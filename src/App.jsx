import { useState } from 'react'
import InfiniteScroll from './components/InfiniteScroll'
import ShareFoodModal from './components/ShareFoodModal'
import AuthModal from './components/AuthModal'
import useFoodPosts from './hooks/useFoodPosts'
import { useAuth } from './lib/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const { foods, loading, addFood } = useFoodPosts()
  const { user, signOut } = useAuth()

  const handleShareClick = () => {
    // If Supabase isn't configured (dev/mock mode), skip auth
    if (!isSupabaseConfigured() || user) {
      setIsModalOpen(true)
    } else {
      setIsAuthOpen(true)
    }
  }

  return (
    <div className="bg-white min-h-screen w-full md:overflow-hidden relative">
      {/* Header */}
      <div className="px-[4%] pt-[34px] pb-0 relative">
        {/* Mobile sign in — top right, static */}
        {!user && (
          <div className="md:hidden flex justify-end mb-2">
            <button
              onClick={() => setIsAuthOpen(true)}
              className="text-[14px] text-text-primary underline underline-offset-2
                bg-transparent border-none cursor-pointer"
            >
              Sign in
            </button>
          </div>
        )}

        {/* Desktop: Sign in + Share Food stacked top-right */}
        <div className="hidden md:flex flex-col items-end gap-3 absolute right-[4%] top-[34px] z-10">
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

        <h1
          className="font-['Inter'] font-black text-black leading-none
            text-[56px] sm:text-[80px] md:text-[110px] lg:text-[134px]
            tracking-tight m-0"
        >
          THERE BE FOOD
        </h1>
      </div>

      {/* Food cards */}
      <div className="mt-[40px] md:mt-[56px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] md:h-[523px]">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <InfiniteScroll foods={foods} />
        )}
      </div>

      {/* Sticky Share Food button — mobile only */}
      <button
        onClick={handleShareClick}
        className="md:hidden fixed bottom-6 right-4 z-30 flex items-center gap-2.5 h-[44px] px-4
          bg-black rounded-full text-white text-base cursor-pointer border-none
          shadow-[0_4px_20px_rgba(0,0,0,0.25)]
          active:scale-95 transition-transform"
      >
        Share Food
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

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
