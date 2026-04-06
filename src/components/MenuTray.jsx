/**
 * Mobile bottom tab bar — Discover, Add, Profile/Sign In
 * Fixed to the bottom of the viewport, always visible.
 */
export default function MenuTray({ onAdd, onAuth, user, onProfile, onDiscover, currentPage }) {
  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white flex items-center justify-center gap-12 h-[72px] px-4 py-2"
      style={{
        borderTop: '1px solid rgba(31,31,31,0.08)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))',
      }}
    >
      {/* Discover */}
      <button
        onClick={onDiscover}
        className="flex flex-col items-center gap-0.5 w-14 bg-transparent border-none cursor-pointer p-0"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={currentPage === 'discover' ? 'black' : '#999'} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </svg>
        <span className={`text-[14px] font-normal leading-5 ${currentPage === 'discover' ? 'text-black' : 'text-gray-400'}`}>Discover</span>
      </button>

      {/* Add */}
      <button
        onClick={onAdd}
        className="flex flex-col items-center gap-0.5 w-14 bg-transparent border-none cursor-pointer p-0"
      >
        <div className="w-7 h-7 bg-[#f4ff20] rounded-lg flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span className="text-[14px] text-black font-normal leading-5">Add</span>
      </button>

      {/* Profile / Sign In */}
      <button
        onClick={user ? onProfile : onAuth}
        className="flex flex-col items-center gap-0.5 w-14 bg-transparent border-none cursor-pointer p-0"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke={currentPage === 'profile' ? 'black' : user ? 'black' : '#999'} strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <span className={`text-[14px] font-normal leading-5 ${currentPage === 'profile' ? 'text-black' : user ? 'text-black' : 'text-gray-400'}`}>
          {user ? 'Profile' : 'Sign In'}
        </span>
      </button>
    </div>
  )
}
