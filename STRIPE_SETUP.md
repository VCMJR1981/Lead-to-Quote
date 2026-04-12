# Stripe Setup Guide

Two separate Stripe integrations to configure.

---

## Part 1 — Stripe Billing (your subscription revenue)

This is how you charge builders $29/€24 per month.

### Step 1 — Create your Stripe account
Go to https://stripe.com and create an account.
Use your Portuguese company entity for payouts.

### Step 2 — Create your products

In Stripe Dashboard → Products → Add product:

**Product 1: Lead-to-Quote USD**
- Name: Lead-to-Quote
- Price: $29.00 / month / recurring
- Currency: USD
- Copy the Price ID (starts with `price_`) → paste as `STRIPE_PRICE_ID_USD`

**Product 2: Lead-to-Quote EUR**
- Name: Lead-to-Quote
- Price: €24.00 / month / recurring
- Currency: EUR
- Copy the Price ID → paste as `STRIPE_PRICE_ID_EUR`

### Step 3 — Enable Customer Portal
In Stripe Dashboard → Settings → Billing → Customer Portal:
- Enable it
- Allow customers to cancel, update payment method
- Save

### Step 4 — Get your API keys
Stripe Dashboard → Developers → API keys:
- Copy Secret key → `STRIPE_SECRET_KEY`
- Copy Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Step 5 — Set up webhook (Billing)
Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://your-app.vercel.app/api/stripe/webhook`
- Events to listen for:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `checkout.session.completed`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Part 2 — Stripe Connect (builders receive client payments)

This is how your builders receive deposits and payments from their clients.

### Step 1 — Enable Connect
Stripe Dashboard → Connect → Get started
Choose: **Platform** type

### Step 2 — Get your Connect Client ID
Stripe Dashboard → Connect → Settings:
- Copy Client ID (starts with `ca_`) → `NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID`

### Step 3 — Add redirect URI
Stripe Dashboard → Connect → Settings → OAuth settings:
- Add redirect URI: `https://your-app.vercel.app/api/stripe/connect/callback`

### Step 4 — Set up Connect webhook
Stripe Dashboard → Developers → Webhooks → Add endpoint:
- URL: `https://your-app.vercel.app/api/stripe/connect/webhook`
- Listen for: **Events on Connected accounts**
- Events:
  - `checkout.session.completed`
  - `payment_intent.payment_failed`
- Copy signing secret → `STRIPE_CONNECT_WEBHOOK_SECRET`

---

## Part 3 — Add all keys to Vercel

In your Vercel project → Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL          (your vercel URL)
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_USD
STRIPE_PRICE_ID_EUR
NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID
STRIPE_CONNECT_WEBHOOK_SECRET
```

Then redeploy.

---

## How it works end to end

**Builder signs up:**
1. Creates account → onboarding
2. Goes to /billing → clicks "Start free trial"
3. Stripe Checkout opens (card details, but not charged for 14 days)
4. After 14 days → charged $29 or €24 automatically
5. If they cancel → middleware blocks access, redirects to /billing

**Builder connects Stripe:**
1. Goes to /billing → clicks "Connect with Stripe"
2. Redirected to Stripe OAuth
3. Creates or connects existing Stripe account
4. Redirected back → `stripe_connect_account_id` saved to database

**Client pays deposit:**
1. Client opens quote link → taps "Pay deposit by card"
2. Stripe Checkout opens (on the builder's connected account)
3. Client pays: quote amount + Stripe fee
4. Builder receives: full quote amount (Stripe fee was added on top)
5. Webhook fires → payment marked as succeeded → lead marked as Won

---

## Testing

Use Stripe test mode:
- Test card: `4242 4242 4242 4242` · Any expiry · Any CVC
- Test failed card: `4000 0000 0000 0002`

Switch to live mode when ready to charge real clients.
