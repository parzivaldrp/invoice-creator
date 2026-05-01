# Step-by-Step: Fix the RLS Error

## The Problem
You're still getting: `new row violates row-level security policy for table "profiles"`

This means the SQL policies haven't been created yet in Supabase.

## Solution: Follow These Exact Steps

### Step 1: Open Supabase Dashboard
1. Go to https://supabase.com
2. Sign in
3. Click on your project

### Step 2: Open SQL Editor
1. In the left sidebar, click **"SQL Editor"** (it has a database icon)
2. Click **"New query"** button (top right)

### Step 3: Copy the SQL Code
**Option A: From the file**
- Open `SIMPLE-FIX.sql` in your project (in Cursor/VS Code)
- Select ALL the text (Cmd+A)
- Copy it (Cmd+C)

**Option B: Copy from below**
Copy this entire block:

```sql
-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  agree_to_terms BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create INSERT policy (THIS FIXES YOUR ERROR!)
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create SELECT policy
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create UPDATE policy
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
```

### Step 4: Paste into Supabase
1. Click in the SQL Editor text box
2. Paste the SQL (Cmd+V or Ctrl+V)
3. You should see all the SQL code in the editor

### Step 5: Run the SQL
1. Click the **"Run"** button (bottom right, or press Cmd+Enter / Ctrl+Enter)
2. Wait 2-3 seconds
3. You should see: **"Success. No rows returned"** or similar

### Step 6: Verify It Worked
1. In Supabase, go to **"Table Editor"** (left sidebar)
2. Click on **"profiles"** table
3. Click the **"Policies"** tab (next to "Columns")
4. You should see 3 policies listed:
   - ✅ "Users can insert own profile"
   - ✅ "Users can view own profile"
   - ✅ "Users can update own profile"

If you see these 3 policies, you're done! ✅

### Step 7: Test Signup
1. Go back to your app
2. Try signing up again
3. It should work now! 🎉

## Still Not Working?

### Check 1: Did you see "Success" message?
- If you got an error when running SQL, share the error message
- Common errors: "permission denied" (need to be project owner)

### Check 2: Do the policies exist?
- Go to Table Editor → profiles → Policies tab
- If you don't see 3 policies, the SQL didn't run successfully

### Check 3: Is RLS enabled?
- In Table Editor → profiles
- Look for a lock icon 🔒 next to table name
- If no lock, RLS might be disabled

### Check 4: Try refreshing
- Sometimes Supabase needs a moment to update
- Refresh your browser
- Try signup again

## Quick Copy-Paste SQL

If you just want to copy-paste quickly, use this:

```sql
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  agree_to_terms BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
```











