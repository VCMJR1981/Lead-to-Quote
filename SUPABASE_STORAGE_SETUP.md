# Supabase Storage Setup

You need to create one storage bucket for photos and logos.

## Steps

1. Go to supabase.com → your project
2. Click **Storage** in the left sidebar
3. Click **New bucket**
4. Name: `business-assets`
5. Toggle **Public bucket** → ON
6. Click **Create bucket**

That's it. The app will now be able to:
- Upload business logos (from onboarding and settings)
- Upload job site photos (from the quote builder)

## If you get "Bucket not found" errors
Just repeat the steps above. The bucket name must be exactly: `business-assets`
