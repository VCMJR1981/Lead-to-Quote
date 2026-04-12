# Quotify — Setup Guide

Quote faster. Win more jobs.

---

## What you need before starting

- A [Supabase](https://supabase.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- [Node.js](https://nodejs.org) installed on your computer (version 18 or higher)

---

## Step 1 — Set up the database in Supabase

1. Go to [supabase.com](https://supabase.com) and open your project (or create a new one)
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Open the file `database/schema.sql` from this project
5. Copy all the contents and paste into the SQL editor
6. Click **Run**
7. You should see "Success" — your database is ready

---

## Step 2 — Get your Supabase keys

1. In Supabase, go to **Project Settings → API**
2. Copy the **Project URL** (looks like `https://xxxx.supabase.co`)
3. Copy the **anon public** key

---

## Step 3 — Configure the app

1. In this project folder, copy the example environment file:
   ```
   cp .env.local.example .env.local
   ```
2. Open `.env.local` and fill in your values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

## Step 4 — Run locally to test

Open your terminal, navigate to this folder, and run:

```bash
npm install
npm run dev
```

Open your browser at [http://localhost:3000](http://localhost:3000)

You should see the Quotify login screen. Create an account and go through onboarding.

---

## Step 5 — Deploy to Vercel

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and click **Add New Project**
3. Import your GitHub repository
4. Under **Environment Variables**, add the same 3 variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (set this to your Vercel URL, e.g. `https://quotify.vercel.app`)
5. Click **Deploy**

---

## How it works

### For you (the business owner)

1. Sign up and complete the 5-minute onboarding
2. Share your intake form link: `yourapp.vercel.app/form/your-business-slug`
3. When a lead comes in, you get a new card in your dashboard
4. Tap the lead → build the quote → send via WhatsApp
5. Customer accepts the quote → you mark it as Won

### For your customers

1. They fill in your intake form (name, phone, job type, description)
2. They receive a clean quote link on their phone
3. They tap "Accept" to confirm

---

## Pages

| Page | URL | Who sees it |
|------|-----|-------------|
| Dashboard | `/` | You (login required) |
| Quote builder | `/lead/[id]` | You (login required) |
| Onboarding | `/onboarding` | You (first time only) |
| Customer quote | `/quote/[id]` | Anyone with the link |
| Intake form | `/form/[slug]` | Anyone with the link |
| Login | `/login` | You |

---

## Adding your logo

Currently the app uses your business initials as a placeholder. To add your logo:

1. Go to your Supabase project → **Storage**
2. Create a bucket called `logos` (set it to **Public**)
3. Upload your logo image
4. Copy the public URL
5. Go to **Table Editor → businesses → your row**
6. Paste the URL into the `logo_url` field

Logo update via the app UI is coming in the next version.

---

## Troubleshooting

**"Business not found" on the intake form**
→ Check that your slug in the URL matches the `slug` column in your `businesses` table in Supabase.

**Login works but redirects to onboarding every time**
→ Your business row is missing. Complete the onboarding flow.

**WhatsApp button doesn't open the right contact**
→ Make sure the phone number in the lead includes the country code (e.g. +351 for Portugal, +1 for USA).

**Quotes not saving**
→ Check your Supabase RLS policies are set correctly. Re-run the schema.sql file if needed.

---

## What's coming next

- Logo upload directly in the app
- Auto-follow-up reminders (48h after quote sent)
- Quote acceptance notifications
- Multi-user (team plans)
- Stripe billing integration
- Revenue reports

---

Built with Next.js · Supabase · Tailwind CSS · Deployed on Vercel
