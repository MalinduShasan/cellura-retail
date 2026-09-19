import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || '';

export const stripe = new Stripe(apiKey, {
  apiVersion: '2025-02-24.acacia' as any,
  appInfo: {
    name: 'Cellura Retail',
    version: '1.0.0',
  },
});
