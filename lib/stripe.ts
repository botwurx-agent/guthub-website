import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  founding: {
    priceId:       process.env.STRIPE_PRICE_FOUNDING!,
    yearlyPriceId: process.env.STRIPE_PRICE_FOUNDING_YEARLY!,
    name: 'Founding Member',
    amount: 1300,
    yearlyAmount: 12500,
    cap: 200,
  },
  launch: {
    priceId:       process.env.STRIPE_PRICE_LAUNCH!,
    yearlyPriceId: process.env.STRIPE_PRICE_LAUNCH_YEARLY!,
    name: 'Launch',
    amount: 2000,
    yearlyAmount: 19000,
    cap: null,
  },
  standard: {
    priceId:       process.env.STRIPE_PRICE_STANDARD!,
    yearlyPriceId: process.env.STRIPE_PRICE_STANDARD_YEARLY!,
    name: 'Standard',
    amount: 2500,
    yearlyAmount: 24000,
    cap: null,
  },
} as const

export type PlanKey = keyof typeof PLANS
export type BillingInterval = 'monthly' | 'yearly'
