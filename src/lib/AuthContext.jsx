import { createContext, useContext, useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

const AuthContext = createContext({
  user: null,
  profile: null,
  loading: true,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch profile for a given user id
  const fetchProfile = async (userId) => {
    if (!userId || !isSupabaseConfigured()) {
      setProfile(null)
      return
    }
    const { data } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', userId)
      .single()
    setProfile(data || null)
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null
      setUser(u)
      fetchProfile(u?.id)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const u = session?.user ?? null
        setUser(u)
        fetchProfile(u?.id)
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  // Email + password sign up — username is saved via user metadata → trigger
  const signUp = async (email, password, username) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    // Check username availability first
    if (username) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .maybeSingle()

      if (existing) {
        throw new Error('Username is already taken')
      }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username: username?.toLowerCase() || null },
      },
    })
    if (error) throw error
    return data
  }

  // Sign in — accepts email or username + password
  const signIn = async (emailOrUsername, password) => {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured')

    let email = emailOrUsername

    // If it doesn't look like an email, look up the email by username
    if (!emailOrUsername.includes('@')) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailOrUsername.toLowerCase())
        .maybeSingle()

      if (!profileData?.email) {
        throw new Error('Username not found')
      }
      email = profileData.email
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading, signUp, signIn, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
