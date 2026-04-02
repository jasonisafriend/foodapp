import { useState, useEffect } from 'react'
import { useAuth } from '../lib/AuthContext'

export default function AuthModal({ onClose }) {
  const { signUp, signIn } = useAuth()

  // Lock body scroll — position:fixed is the only reliable method on iOS
  useEffect(() => {
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.overflow = ''
      window.scrollTo(0, scrollY)
    }
  }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!email.trim() || !password) return
    setError(null)
    setLoading(true)
    try {
      if (mode === 'signup') {
        await signUp(email.trim(), password)
      } else {
        await signIn(email.trim(), password)
      }
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
        <div className="bg-white w-full max-w-[420px] rounded-t-[20px] md:rounded-[20px] p-6 md:p-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-['Inter'] font-black text-black text-2xl">
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full
                hover:bg-gray-100 transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full h-[48px] px-4 border-[1.5px] border-dashed border-brand-100
                rounded-lg text-base text-text-primary placeholder:text-neutral-500
                outline-none bg-white font-['Inter']"
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full h-[48px] px-4 border-[1.5px] border-dashed border-brand-100
                rounded-lg text-base text-text-primary placeholder:text-neutral-500
                outline-none bg-white font-['Inter']"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={!email.trim() || !password || loading}
              className="w-full h-[48px] bg-black rounded-full text-white text-base
                font-medium cursor-pointer border-none
                hover:bg-gray-800 transition-colors
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? (mode === 'signin' ? 'Signing in...' : 'Creating account...')
                : (mode === 'signin' ? 'Sign in' : 'Sign up')
              }
            </button>
            <button
              onClick={toggleMode}
              className="text-sm text-neutral-500 bg-transparent border-none
                cursor-pointer hover:text-text-primary transition-colors"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'
              }
            </button>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-500">{error}</p>
          )}
        </div>
      </div>
    </>
  )
}
