import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { mockFoodPosts } from '../lib/mockData'

export default function useFoodPosts() {
  const [foods, setFoods] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFoods = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setFoods(mockFoodPosts)
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('food_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      // Real posts first, then placeholder cards to fill the feed
      setFoods([...(data || []), ...mockFoodPosts])
    } catch (err) {
      console.error('Error fetching food posts:', err)
      setFoods(mockFoodPosts)
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

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('food-photos')
        .getPublicUrl(fileName)

      image_url = urlData.publicUrl
    }

    // Get current user id — session is more reliable than getUser() here
    const { data: { session } } = await supabase.auth.getSession()
    const user_id = session?.user?.id || null

    // Insert the food post
    const { data, error } = await supabase
      .from('food_posts')
      .insert([{ name, description, location, price, image_url, maps_url: mapsUrl || null, user_id }])
      .select()
      .single()

    if (error) throw error

    setFoods(prev => [data, ...prev])
    return data
  }, [])

  useEffect(() => {
    fetchFoods()
  }, [fetchFoods])

  return { foods, loading, addFood, refetch: fetchFoods }
}
