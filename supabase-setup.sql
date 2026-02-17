-- ============================================
-- Supabase Database Setup for Invoice Creator
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- 1. Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  agree_to_terms BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- 4. Create function to handle profile creation (optional, more secure)
CREATE OR REPLACE FUNCTION public.create_user_profile(
  user_id UUID,
  full_name TEXT,
  agree_to_terms BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, agree_to_terms)
  VALUES (user_id, full_name, agree_to_terms)
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = EXCLUDED.full_name,
    agree_to_terms = EXCLUDED.agree_to_terms,
    updated_at = TIMEZONE('utc'::text, NOW());
END;
$$;

-- 5. (Optional) Create trigger to auto-create profile on user signup
-- This automatically creates a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, agree_to_terms)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'agree_to_terms')::boolean, false)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_profile TO anon, authenticated;

-- ============================================
-- Notes:
-- ============================================
-- Option A: Use RLS Policies (already set up above)
--   - Users can directly insert/update their own profiles
--   - More flexible, allows updates from client
--
-- Option B: Use Database Trigger (already set up above)
--   - Automatically creates profile on signup
--   - More secure, but requires passing data via metadata
--
-- Option C: Use Database Function (already set up above)
--   - Call create_user_profile() function from client
--   - Runs with elevated permissions (SECURITY DEFINER)
--   - Most secure option
--
-- The code will try Option C first, then fall back to direct insert
-- ============================================











