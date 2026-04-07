import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

// Fisher-Yates shuffle
function shuffle(array) {
  const a = [...array]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function useFoodPosts() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFoods = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setFoods([])
      setLoading(false)
      return
    }

    try {
      // Try fetching with profile join first
      let { data, error } = await supabase
        .from('food_posts')
        .select('*, profiles:user_id(username)')

      // If the join fails (e.g. missing FK relationship), fetch without it
      if (error) {
        console.warn('food_posts join query failed, retrying without join:', error.message)
        const fallback = await supabase
          .from('food_posts')
          .select('*')
        data = fallback.data
        error = fallback.error
      }

      if (error) throw error

      // Flatten the joined profile data and shuffle for random order each load
      const posts = (data || []).map(post => ({
        ...post,
        username: post.profiles?.username || null,
      }))
      setFoods(shuffle(posts))
    } catch (err) {
      console.error('Error fetching food posts:', err)
      setFoods([])
    } finally {
      setLoading(false)
    }
  }, [])

  const addFood = useCallback(async ({ name, description, location, price, mapsUrl, photo, photoPreview }) => {
    if (!isSupabaseConfigured()) {
      // Add to local state with mock behavior
      const newPost = {
        id: Date.now(),
        name,
        description,
        location,
        price,
        maps_url: mapsUrl || null,
        image_url: photoPreview || null,
        created_at: new Date().toISOString(),
      }
      setFoods(prev => [newPost, ...prev])
      return newPost
    }

    let image_url = null

    // Upload photo to Supabase Storage if provided
    if (photo) {
      const fileExt = photo.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('food-photos')
        .upload(fileName, photo)

      if (uploadError) {
        console.error('Photo upload failed:', uploadError)
        // Continue without image rather than blocking the whole post
      } else {
        const { data: urlData } = supabase.storage
          .from('food-photos')
          .getPublicUrl(fileName)
        image_url = urlData.publicUrl
      }
    }

    // Get current user id
    const { data: { session } } = await supabase.auth.getSession()
    const user_id = session?.user?.id || null

    // Insert the food post
    const insertPayload = { name, description, location, price, image_url, maps_url: mapsUrl || null, user_id }

    const { data, error } = await supabase
      .from('food_posts')
      .insert([insertPayload])
      .select()
      .single()

    if (error) {
      console.error('Insert error:', error)
      throw error
    }

    // Fetch the username for the current user to match the shape of fetched posts
    let username = null
    if (user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user_id)
        .maybeSingle()
      username = profileData?.username || null
    }

    const newPost = { ...data, username }
    setFoods(prev => [newPost, ...prev])
    return newPost
  }, [])

  useEffect(() => {
    fetchFoods()
  }, [fetchFoods])

  return { foods, loading, addFood, refetch: fetchFoods }
}
