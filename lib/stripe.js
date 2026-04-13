import Stripe from 'stripe'

// Lazy initialization — only runs at request time, not build time
let _stripe = null
export function getStripe() {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-04-10',
    })
  }
  return _stripe
}

export const PRICE_IDS = {
  USD: process.env.STRIPE_PRICE_ID_USD,
  EUR: process.env.STRIPE_PRICE_ID_EUR,
}

export const CONNECT_CLIENT_ID = process.env.NEXT_PUBLIC_STRIPE_CONNECT_CLIENT_ID

export const PLANS = {
  USD: { price: '$29', currency: 'USD', label: 'Lead-to-Quote · $29/mo' },
  EUR: { price: '€24', currency: 'EUR', label: 'Lead-to-Quote · €24/mo' },
}
