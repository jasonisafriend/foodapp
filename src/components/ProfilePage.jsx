import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../lib/AuthContext'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

export default function ProfilePage({ onBack, onSignOut }) {
  const { user, profile, refreshProfile } = useAuth()
  const [activeTab, setActiveTab] = useState('recent') // 'recent' | 'bookmarked'
  const [isEditingUsername, setIsEditingUsername] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [usernameError, setUsernameError] = useState(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const inputRef = useRef(null)
  const [myPosts, setMyPosts] = useState([])
  const [loadingPosts, setLoadingPosts] = useState(true)

  // Load current username into input when profile loads
  useEffect(() => {
    if (profile?.username) {
      setUsernameInput(profile.username)
    }
  }, [profile?.username])

  // Fetch user's own posts
  const fetchMyPosts = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setLoadingPosts(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('food_posts')
        .select('id, name, image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMyPosts(data || [])
    } catch (err) {
      console.error('Error fetching user posts:', err)
    } finally {
      setLoadingPosts(false)
    }
  }, [user])

  useEffect(() => {
    fetchMyPosts()
  }, [fetchMyPosts])

  // Auto-save username on blur or Enter
  const handleSaveUsername = async () => {
    const clean = usernameInput.trim().toLowerCase()

    // No change — just close editor
    if (!clean || clean === profile?.username) {
      setIsEditingUsername(false)
      setUsernameError(null)
      return
    }
    if (clean.length < 3) {
      setUsernameError('Must be at least 3 characters')
      return
    }
    if (!/^[a-z0-9_]+$/.test(clean)) {
      setUsernameError('Only letters, numbers, and underscores')
      return
    }

    setSavingUsername(true)
    setUsernameError(null)
    setSaveSuccess(false)
    try {
      // Check availability
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', clean)
        .neq('id', user.id)
        .maybeSingle()

      if (existing) {
        setUsernameError('Username is already taken')
        setSavingUsername(false)
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({ username: clean })
        .eq('id', user.id)

      if (error) throw error

      // Refresh profile in AuthContext so the new username propagates everywhere
      await refreshProfile()

      setSaveSuccess(true)
      setIsEditingUsername(false)

      // Flash success indicator briefly
      setTimeout(() => setSaveSuccess(false), 1500)
    } catch (err) {
      setUsernameError(err.message)
    } finally {
      setSavingUsername(false)
    }
  }

  const displayUsername = profile?.username || 'your_username'
  const postCount = myPosts.length

  // Format date like "apr 5"
  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    const month = d.toLocaleString('en-US', { month: 'short' }).toLowerCase()
    return `${month} ${d.getDate()}`
  }

  return (
    <div
      className="md:hidden fixed inset-0 z-30 bg-white flex flex-col"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center
            bg-transparent border-none cursor-pointer"
          style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>

        <button
          onClick={onSignOut}
          className="w-10 h-10 rounded-full flex items-center justify-center
            bg-transparent border-none cursor-pointer"
          style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="black" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
          </svg>
        </button>
      </div>

      {/* Profile section */}
      <div className="flex flex-col items-center pt-4 pb-6 px-4">
        {/* Avatar circle */}
        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center mb-3">
          <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>

        {/* Username — tap to edit, auto-saves on blur or Enter */}
        {isEditingUsername ? (
          <div className="flex flex-col items-center gap-1.5 w-full max-w-[260px]">
            <div className="flex items-center gap-1">
              <span className="text-gray-400 text-base font-['Inter']">@</span>
              <input
                ref={inputRef}
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                  setUsernameError(null)
                }}
                maxLength={20}
                autoFocus
                className="text-base font-['Inter'] text-black border-b-[1.5px] border-dashed border-gray-300
                  outline-none bg-transparent text-center w-[160px] pb-0.5"
                style={{ fontSize: '16px' }}
                onBlur={handleSaveUsername}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur() // triggers onBlur → handleSaveUsername
                  }
                  if (e.key === 'Escape') {
                    setUsernameInput(profile?.username || '')
                    setUsernameError(null)
                    setIsEditingUsername(false)
                  }
                }}
              />
            </div>
            {savingUsername && (
              <span className="text-xs text-gray-400 font-['Inter']">Saving...</span>
            )}
            {usernameError && (
              <p className="text-xs text-red-500 m-0">{usernameError}</p>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              setIsEditingUsername(true)
              // Focus input after render
              setTimeout(() => inputRef.current?.focus(), 50)
            }}
            className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
          >
            <span className="text-gray-400 text-base font-['Inter']">@</span>
            <span className="text-base font-['Inter'] text-black">{displayUsername}</span>
            {saveSuccess ? (
              <svg className="w-3.5 h-3.5 text-green-500 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5 text-gray-400 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-0 pb-5">
        {[
          { label: 'Followers', value: 0 },
          { label: 'Following', value: 0 },
          { label: 'Posts', value: postCount },
        ].map((stat, i) => (
          <div key={stat.label} className="flex flex-col items-center w-20">
            <span className="text-xl font-semibold font-['Inter'] text-black leading-6">{stat.value}</span>
            <span className="text-xs text-gray-400 font-['Inter'] leading-5">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex-1 py-3 text-center text-sm font-['Inter'] bg-transparent border-none cursor-pointer
            ${activeTab === 'recent' ? 'text-black font-semibold' : 'text-gray-400 font-normal'}`}
          style={{
            borderBottom: activeTab === 'recent' ? '2px solid black' : '2px solid transparent',
          }}
        >
          Recent Eats
        </button>
        <button
          onClick={() => setActiveTab('bookmarked')}
          className={`flex-1 py-3 text-center text-sm font-['Inter'] bg-transparent border-none cursor-pointer
            ${activeTab === 'bookmarked' ? 'text-black font-semibold' : 'text-gray-400 font-normal'}`}
          style={{
            borderBottom: activeTab === 'bookmarked' ? '2px solid black' : '2px solid transparent',
          }}
        >
          Bookmarked
        </button>
      </div>

      {/* Content grid */}
      <div className="flex-1 overflow-y-auto px-3 pt-3" style={{ paddingBottom: 'max(80px, calc(72px + env(safe-area-inset-bottom, 8px)))' }}>
        {activeTab === 'recent' ? (
          loadingPosts ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
            </div>
          ) : myPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <p className="text-sm font-['Inter']">No posts yet</p>
              <p className="text-xs font-['Inter'] mt-1">Share your first food find!</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {myPosts.map((post) => (
                <div
                  key={post.id}
                  className="relative rounded-xl overflow-hidden"
                  style={{ aspectRatio: '112 / 140' }}
                >
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="text-2xl">🍽</span>
                    </div>
                  )}
                  {/* Dark overlay with date */}
                  <div className="absolute inset-x-0 bottom-0 h-10 flex items-end pb-2 pl-2.5"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
                  >
                    <span className="text-white text-xs font-['Inter'] font-medium">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* Bookmarked tab — placeholder */
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <svg className="w-8 h-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
            </svg>
            <p className="text-sm font-['Inter']">No bookmarks yet</p>
            <p className="text-xs font-['Inter'] mt-1">Save food finds while browsing!</p>
          </div>
        )}
      </div>
    </div>
  )
}
