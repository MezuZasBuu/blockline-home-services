import 'server-only';
import type Stripe from 'stripe';
import type { ServiceSettings } from '@/modules/configuration/schema';

// Internal adapter only. No public charge/setup endpoint exists in Milestone 1.
// Inputs must come from an authorized booking and its immutable configuration snapshot.
export function setupSessionParameters(input:{bookingId:string;stripeCustomerId:string;successUrl:string;cancelUrl:string;consentVersion:string}):Stripe.Checkout.SessionCreateParams {
  return {mode:'setup',customer:input.stripeCustomerId,payment_method_types:['card'],
    success_url:input.successUrl,cancel_url:input.cancelUrl,
    setup_intent_data:{metadata:{booking_id:input.bookingId,consent_version:input.consentVersion}},
    metadata:{booking_id:input.bookingId}};
}
export function deferredChargeParameters(input:{
  policy:ServiceSettings['paymentPolicy'];bookingId:string;verifiedAt:string|null;
  methodStatus:'pending'|'ready'|'failed'|'revoked';stripeCustomerId:string;paymentMethodId:string;
  amountCents:number;consentAt:string|null;
}):Stripe.PaymentIntentCreateParams {
  if(input.policy.mode!=='collect_at_booking_charge_after_verification' || !input.verifiedAt || input.methodStatus!=='ready' || !input.consentAt)
    throw new Error('Deferred charge prerequisites not satisfied');
  if(!Number.isSafeInteger(input.amountCents) || input.amountCents<=0) throw new Error('Invalid charge amount');
  return {amount:input.amountCents,currency:'usd',customer:input.stripeCustomerId,payment_method:input.paymentMethodId,
    off_session:true,confirm:true,metadata:{booking_id:input.bookingId}};
}
