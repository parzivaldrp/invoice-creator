# How to Enable Insert Policies in Supabase

## Step-by-Step Instructions

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in to your account
3. Select your project (the one you're using for this invoice app)  

### Step 2: Open SQL Editor
1. In the left sidebar, look for **"SQL Editor"** (it has a database icon 📊)
2. Click on it
3. You'll see a query editor interface

### Step 3: Open the SQL File
1. In your project folder, open the file: `fix-rls-policy.sql`
2. **Select all** the text in that file (Cmd+A on Mac, Ctrl+A on Windows)
3. **Copy** it (Cmd+C or Ctrl+C)

### Step 4: Paste and Run the SQL
1. Go back to Supabase SQL Editor
2. Click in the editor area (you'll see a text box)
3. **Paste** the SQL code (Cmd+V or Ctrl+V)
4. You should see the entire SQL script in the editor

### Step 5: Execute the Script
1. Click the **"Run"** button (usually at the bottom right, or press `Cmd+Enter` / `Ctrl+Enter`)
2. Wait a few seconds
3. You should see a success message like: "Success. No rows returned"

### Step 6: Verify It Worked
1. In the left sidebar, click **"Table Editor"**
2. Find the **"profiles"** table in the list
3. Click on it
4. You should see a lock icon 🔒 next to the table name (this means RLS is enabled)
5. Click on **"Policies"** tab (next to "Columns" and "Data")
6. You should see 3 policies:
   - ✅ "Users can view own profile"
   - ✅ "Users can insert own profile" ← **This is the one that fixes your error!**
   - ✅ "Users can update own profile"

## What the SQL Does

The SQL script creates these policies:

### 1. SELECT Policy (View)
```sql
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
```
**Meaning**: Users can only view profiles where the `id` matches their user ID.

### 2. INSERT Policy (Create) ← **This fixes your error!**
```sql
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```
**Meaning**: Users can only insert profiles where the `id` matches their user ID.

### 3. UPDATE Policy (Edit)
```sql
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```
**Meaning**: Users can only update profiles where the `id` matches their user ID.

## Alternative: Manual Policy Creation

If you prefer to create policies manually through the UI:

### Via Supabase Dashboard:
1. Go to **Table Editor** → **profiles** table
2. Click the **"Policies"** tab
3. Click **"New Policy"**
4. Choose **"Create a policy from scratch"**
5. Fill in:
   - **Policy name**: "Users can insert own profile"
   - **Allowed operation**: `INSERT`
   - **Target roles**: `authenticated`
   - **USING expression**: Leave empty
   - **WITH CHECK expression**: `auth.uid() = id`
6. Click **"Review"** then **"Save policy"**

## Testing

After running the SQL:

1. Go back to your app
2. Try signing up with a new account
3. It should work without the RLS error! ✅

## Troubleshooting

### If you get an error when running the SQL:

**Error: "relation already exists"**
- This means the table already exists - that's fine, the script handles this

**Error: "policy already exists"**
- The script drops existing policies first, so this shouldn't happen
- If it does, the policies are already set up!

**Error: "permission denied"**
- Make sure you're logged in as the project owner/admin
- Check that you have the correct permissions

### If signup still doesn't work:

1. **Check the policies exist**:
   - Go to Table Editor → profiles → Policies tab
   - Make sure you see all 3 policies

2. **Check RLS is enabled**:
   - In Table Editor → profiles
   - Look for a lock icon 🔒 next to the table name
   - If it's not there, RLS might be disabled

3. **Check the browser console**:
   - Open Developer Tools (F12)
   - Look for any error messages
   - The error should be different now if policies are set up

## Quick Reference

**File to use**: `fix-rls-policy.sql`

**Key policy that fixes your error**:
```sql
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);
```

**What it does**: Allows users to insert a profile row only if the `id` column matches their authenticated user ID.

