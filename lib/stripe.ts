import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  founding: {
    priceId: process.env.STRIPE_PRICE_FOUNDING!,
    name: 'Founding Member',
    amount: 1300,
    cap: 200,
  },
  launch: {
    priceId: process.env.STRIPE_PRICE_LAUNCH!,
    name: 'Launch',
    amount: 2000,
    cap: null,
  },
  standard: {
    priceId: process.env.STRIPE_PRICE_STANDARD!,
    name: 'Standard',
    amount: 2500,
    cap: null,
  },
} as const

export type PlanKey = keyof typeof PLANS
