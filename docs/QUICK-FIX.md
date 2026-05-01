# Quick Fix: RLS Policy Error

## The Problem
You're seeing this error:
```
new row violates row-level security policy for table "profiles"
```

This happens because Supabase's Row Level Security (RLS) is enabled on the `profiles` table, but there's no policy allowing users to insert their own profile.

## The Solution (2 minutes)

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Sign in and select your project

### Step 2: Open SQL Editor
1. Click on **"SQL Editor"** in the left sidebar
2. Click **"New query"**

### Step 3: Run the SQL Script
1. Open the file `fix-rls-policy.sql` from this project
2. **Copy the entire contents** of that file
3. **Paste it into the SQL Editor** in Supabase
4. Click **"Run"** (or press Cmd/Ctrl + Enter)

### Step 4: Verify It Worked
You should see a success message. The script will:
- ✅ Create the `profiles` table (if it doesn't exist)
- ✅ Enable RLS on the table
- ✅ Create policies that allow users to insert/update their own profiles

### Step 5: Test Signup Again
Go back to your app and try signing up again. It should work now! 🎉

## What the SQL Does

The SQL script creates three RLS policies:
1. **View Policy**: Users can view their own profile
2. **Insert Policy**: Users can insert their own profile (this fixes your error!)
3. **Update Policy**: Users can update their own profile

## Still Having Issues?

If you still get errors after running the SQL:
1. Check that the `profiles` table exists in your Supabase dashboard (Table Editor)
2. Verify the table has these columns:
   - `id` (UUID, primary key)
   - `full_name` (text)
   - `agree_to_terms` (boolean)
3. Check that RLS is enabled (should show a lock icon in Table Editor)

## Alternative: Full Setup

If you want the complete setup (including database functions and triggers), use `supabase-setup.sql` instead. The `fix-rls-policy.sql` file is the minimal fix for the immediate issue.











