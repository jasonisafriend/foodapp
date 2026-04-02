-- Create the food_posts table
CREATE TABLE food_posts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  price NUMERIC(10, 2),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (allow public read/write for now)
ALTER TABLE food_posts ENABLE ROW LEVEL SECURITY;

-- Policy: anyone can read food posts
CREATE POLICY "Anyone can read food posts"
  ON food_posts FOR SELECT
  USING (true);

-- Policy: anyone can insert food posts
CREATE POLICY "Anyone can insert food posts"
  ON food_posts FOR INSERT
  WITH CHECK (true);

-- Create the storage bucket for food photos
-- (Run this in the Supabase Dashboard > Storage > New Bucket)
-- Bucket name: food-photos
-- Public bucket: YES
