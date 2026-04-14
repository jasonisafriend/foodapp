import { useState, useMemo } from 'react'
import IntroScreen from './components/IntroScreen'
import InfiniteScroll from './components/InfiniteScroll'
import ShareFoodModal from './components/ShareFoodModal'
import AuthModal from './components/AuthModal'
import MenuTray from './components/MenuTray'
import TopBar from './components/TopBar'
import ProfilePage from './components/ProfilePage'
import PostDetail from './components/PostDetail'
import useFoodPosts from './hooks/useFoodPosts'
import useScrollColor from './hooks/useScrollColor'
import { useAuth } from './lib/AuthContext'
import { isSupabaseConfigured } from './lib/supabase'

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('discover') // 'discover' | 'profile'
  const [showIntro, setShowIntro] = useState(true)
  const [selectedPost, setSelectedPost] = useState(null) // { food, source: 'profile-recent' | 'profile-bookmarked' }
  const [profileRefreshKey, setProfileRefreshKey] = useState(0)
  const [selectedTag, setSelectedTag] = useState(null) // canonical tag slug or null
  const { foods, loading, addFood, updateFood, deleteFood } = useFoodPosts()

  // Client-side tag filter over the already-fetched feed.
  const visibleFoods = useMemo(() => {
    if (!selectedTag) return foods
    return foods.filter((f) => Array.isArray(f.tags) && f.tags.includes(selectedTag))
  }, [foods, selectedTag])
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

      {/* Mobile top bar — only on discover */}
      {currentPage === 'discover' && (
        <TopBar
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />
      )}

      {/* Food cards — on mobile the carousel is fixed/full-screen, on desktop flows normally */}
      <div className="mt-0 md:mt-[56px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] md:h-[523px]">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : visibleFoods.length === 0 && selectedTag ? (
          <div className="flex flex-col items-center justify-center h-[400px] md:h-[523px] px-6 text-center">
            <p className="font-['Playfair_Display'] italic text-[22px] text-[#1f1f1f] m-0">
              No posts tagged #{selectedTag} yet
            </p>
            <button
              onClick={() => setSelectedTag(null)}
              className="mt-3 text-[14px] text-[#1f1f1f] underline underline-offset-2
                bg-transparent border-none cursor-pointer font-['Inter']"
            >
              Clear filter
            </button>
          </div>
        ) : (
          <InfiniteScroll foods={visibleFoods} onScrollProgress={onScrollProgress} />
        )}
      </div>

      {/* Profile page overlay (mobile only) */}
      {currentPage === 'profile' && user && (
        <ProfilePage
          onBack={() => setCurrentPage('discover')}
          onSignOut={handleSignOut}
          onOpenPost={(food, source) => setSelectedPost({ food, source })}
          refreshKey={profileRefreshKey}
        />
      )}

      {/* Post detail overlay — opened from Profile only */}
      {selectedPost && (
        <PostDetail
          food={selectedPost.food}
          editable={selectedPost.source === 'profile-recent'}
          deletable={selectedPost.source === 'profile-recent'}
          onBack={() => setSelectedPost(null)}
          onSave={async (patch) => {
            const updated = await updateFood(selectedPost.food.id, patch)
            setSelectedPost((prev) => prev ? { ...prev, food: { ...prev.food, ...updated } } : prev)
            setProfileRefreshKey((k) => k + 1)
          }}
          onDelete={async () => {
            await deleteFood(selectedPost.food.id)
            setSelectedPost(null)
            setProfileRefreshKey((k) => k + 1)
          }}
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

      {/* Intro screen (mobile, first visit only) */}
      {showIntro && <IntroScreen onDismiss={() => setShowIntro(false)} />}

      {/* Share Food Modal */}
      <ShareFoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addFood}
      />
    </div>
  )
}
