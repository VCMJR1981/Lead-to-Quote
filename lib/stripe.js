import Stripe from 'stripe'

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-04-10',
})

// Price IDs per currency — set in Stripe Dashboard → Products
export const PRICE_IDS = {
  USD: process.env.STRIPE_PRICE_ID_USD,
  EUR: process.env.STRIPE_PRICE_ID_EUR,
}

// Your platform's Stripe Connect client ID
export const CONNECT_CLIENT_ID = process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID

// Plan details shown in UI
export const PLANS = {
  USD: { price: '$29', currency: 'USD', label: 'Lead-to-Quote · $29/mo' },
  EUR: { price: '€24', currency: 'EUR', label: 'Lead-to-Quote · €24/mo' },
}
