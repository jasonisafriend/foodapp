import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

const AuthContext = createContext({
  user: null,
  loading: true,
  signInWithEmail: async () => {},
  verifyEmailOtp: async () => {},
  signInWithProvider: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  // Email magic link / OTP
  const signInWithEmail = async (email) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithOtp({ email })
    if (error) throw error
  }

  const verifyEmailOtp = async (email, token) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    })
    if (error) throw error
    return data
  }

  // OAuth (Google, Apple, etc.)
  const signInWithProvider = async (provider) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin,
      },
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{
      user, loading, signInWithEmail, verifyEmailOtp, signInWithProvider, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
