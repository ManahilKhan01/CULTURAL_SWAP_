# How to Deploy Profile Editing Fixes

## Quick Start Guide

All fixes have been implemented in the codebase. Follow these steps to get everything working:

---

## Step 1: Execute Storage Setup SQL

This creates the necessary Supabase storage bucket for profile images.

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Click "New Query"
4. Copy and paste the contents of `CREATE_PROFILE_STORAGE.sql`
5. Click "Run"

**What this does:**
- Creates `user-profiles` storage bucket
- Sets up Row Level Security policies
- Allows authenticated users to upload their profile pictures

---

## Step 2: Verify Environment Variables

Make sure your `.env.local` file has:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Step 3: Test the Fixes

### Test 1: Update Profile Name

1. Log in to your account
2. Go to **Settings** (or navigate to `/settings`)
3. Under "Edit Profile" tab:
   - Update your **Full Name**
   - Click **"Save Changes"**
4. **Expected Result:**
   - Toast notification: "Profile Updated"
   - Redirect to Dashboard (after 1.5 seconds)
   - Dashboard shows updated name in welcome message
   - Navbar shows updated name
   - Progress bar updated if profile completion changed

**If it fails:**
- Check browser console for error messages
- Verify you're logged in (`supabase.auth.getUser()` should return a user)
- Check that Supabase connection is working

### Test 2: Update Profile Picture

1. Go to **Settings** → **Edit Profile** tab
2. Click **"Change Photo"**
3. Select an image from your computer
4. Verify preview shows in the form
5. Click **"Save Changes"**
6. **Expected Result:**
   - Toast notification: "Profile Updated" (or "Profile updated but image upload failed" if image failed)
   - Image uploaded to Supabase Storage
   - Profile picture URL updated in database
   - New picture appears in navbar and profile page
   - Redirect to Dashboard

**If image upload fails:**
- Check that `user-profiles` bucket exists in Supabase Storage
- Verify RLS policies are correctly set up
- Check browser console for specific error message
- Try "Save (No Image)" button as fallback

### Test 3: Progress Bar Updates

1. Go to **Settings** → **Edit Profile** tab
2. Fill in missing profile information:
   - Add a **Bio**
   - Add **City** and **Country**
   - Add **Skills You Offer** (comma separated)
3. Click **"Save Changes"**
4. When redirected to Dashboard:
   - Look at "Profile Completion" card on the right
   - **Progress bar should increase** to reflect new completion %
   - Checklist items should show as completed (✓)

---

## What Was Fixed

### 1. ✅ Authentication Error ("Not authenticated")
- **Before:** Used unreliable `getSession()` method
- **After:** Uses reliable `getUser()` with proper error handling
- **Impact:** Users can now save profiles without auth errors

### 2. ✅ Failed Profile Picture Upload
- **Before:** Tried to store base64 images in database (too large)
- **After:** Uploads to Supabase Storage, stores only URL
- **Impact:** Profile pictures now upload successfully

### 3. ✅ Progress Bar Not Updating
- **Before:** Dashboard data not refreshing after profile update
- **After:** Dashboard listens for `profileUpdated` event and refreshes
- **Impact:** Progress bar updates immediately after profile save

### 4. ✅ Name Not Showing Everywhere
- **Before:** Updated name only visible after page reload
- **After:** Navbar and other components listen for profile update event
- **Impact:** Name updates instantly across entire app

### 5. ✅ Automatic Dashboard Redirect
- **Status:** Already implemented, now guaranteed to work
- **After:** Happens after 1.5 second delay with toast notification
- **Impact:** Smooth user experience after profile update

---

## Modified Files

| File | Purpose |
|------|---------|
| `src/lib/profileService.ts` | Added image upload method |
| `src/pages/Settings.tsx` | Fixed auth & image handling |
| `src/pages/Dashboard.tsx` | Added data refresh on profile update |
| `src/pages/Profile.tsx` | Added data refresh on profile update |
| `CREATE_PROFILE_STORAGE.sql` | **NEW** - Storage bucket setup |

---

## Troubleshooting

### Problem: "Not authenticated" error still appears

**Solution:**
1. Check that user is logged in
2. Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
3. Check browser console for specific error
4. Clear browser cache and try again
5. Try "Save (No Image)" to see if it's an image upload issue

### Problem: Image upload fails with "failed to fetch"

**Solution:**
1. Make sure `CREATE_PROFILE_STORAGE.sql` has been executed
2. Verify `user-profiles` bucket exists in Supabase Storage
3. Check that RLS policies are enabled
4. Verify image file size (should be under 5MB)
5. Try again with a different image format (JPG/PNG)

### Problem: Progress bar doesn't update

**Solution:**
1. Make sure you're looking at the Dashboard after redirect
2. Wait a moment for data to load
3. Refresh the page to force data reload
4. Check browser console for errors
5. Verify profile data was actually saved to database

### Problem: Name doesn't update in navbar

**Solution:**
1. Clear browser cache/local storage
2. Log out and log back in
3. Check that profile data was saved to database
4. Verify `profileUpdated` event is being triggered (check console)
5. Try navigating to another page and back

### Problem: Redirect to Dashboard doesn't happen

**Solution:**
1. Check browser console for JavaScript errors
2. Verify navigation is working (try manual navigation)
3. Make sure Settings component has router context
4. Try clearing browser cache

---

## Success Indicators

When everything is working correctly, you should see:

✅ Profile name saves without errors
✅ Profile picture uploads successfully
✅ Progress bar increases when profile info is added
✅ Dashboard loads after profile update
✅ Name updated in navbar immediately
✅ Image appears in profile and navbar
✅ Toast notifications confirm actions
✅ No console errors (except possibly unrelated ones)

---

## Additional Commands

### Reset Profile Data (for testing)

If you want to reset to test fresh:

```sql
-- Clear profile images from storage (do manually in Supabase UI)

-- Update profile back to defaults
UPDATE user_profiles 
SET profile_image_url = NULL,
    full_name = 'Test User',
    bio = NULL,
    city = NULL,
    country = NULL,
    skills_offered = NULL,
    skills_wanted = NULL
WHERE id = 'your_user_id';
```

### Check if Storage Bucket Exists

```sql
SELECT * FROM storage.buckets WHERE name = 'user-profiles';
```

---

## Questions or Issues?

Check the console (F12 → Console tab) for detailed error messages. Most issues can be diagnosed from there.

Common console errors:
- `403 Forbidden` → Check RLS policies
- `bucket does not exist` → Run CREATE_PROFILE_STORAGE.sql
- `not authenticated` → Check login status
- `CORS error` → Check Supabase project settings
