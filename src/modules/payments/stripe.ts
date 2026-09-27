import 'server-only';
import Stripe from 'stripe';
import { requiredSecret } from '@/server/env';
export function stripeClient() { return new Stripe(requiredSecret('STRIPE_SECRET_KEY')); }
export function verifyStripeEvent(rawBody:string,signature:string) {
  return stripeClient().webhooks.constructEvent(rawBody,signature,requiredSecret('STRIPE_WEBHOOK_SECRET'));
}
