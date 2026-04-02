-- =============================================
-- STEP 1: Food posts table
-- =============================================
CREATE TABLE food_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price NUMERIC(10, 2),
  image_url TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 2: Profiles table (auto-created on sign-up)
-- =============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STEP 3: Auto-create a profile row on new sign-up
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, display_name)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- STEP 4: Row Level Security
-- =============================================

-- food_posts
ALTER TABLE food_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read food posts"
  ON food_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert food posts"
  ON food_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food posts"
  ON food_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food posts"
  ON food_posts FOR DELETE
  USING (auth.uid() = user_id);

-- profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read profiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- STEP 5: Storage bucket for food photos
-- (Create manually in Supabase Dashboard > Storage)
-- Bucket name: food-photos
-- Public bucket: YES
-- =============================================
