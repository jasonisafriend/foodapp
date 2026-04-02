import { useState } from 'react'
import InfiniteScroll from './components/InfiniteScroll'
import ShareFoodModal from './components/ShareFoodModal'
import useFoodPosts from './hooks/useFoodPosts'

export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { foods, loading, addFood } = useFoodPosts()

  return (
    <div className="bg-white min-h-screen w-full overflow-hidden relative">
      {/* Header area — fixed position on desktop */}
      <div className="px-[4%] pt-[34px] pb-0">
        <div className="flex items-start justify-between">
          <h1
            className="font-['Inter'] font-black text-black leading-none
              text-[56px] sm:text-[80px] md:text-[110px] lg:text-[134px]
              tracking-tight m-0"
          >
            THERE BE FOOD
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2.5 h-[44px] px-4 bg-black rounded-full
              text-white text-xl cursor-pointer border-none shrink-0 mt-4 md:mt-8
              hover:bg-gray-800 transition-colors"
          >
            Share Food
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Scrolling food cards */}
      <div className="mt-[40px] md:mt-[56px]">
        {loading ? (
          <div className="flex items-center justify-center h-[400px] md:h-[523px]">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <InfiniteScroll foods={foods} />
        )}
      </div>

      {/* Share Food Modal */}
      <ShareFoodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={addFood}
      />
    </div>
  )
}
