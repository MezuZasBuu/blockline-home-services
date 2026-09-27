import { verifyStripeEvent } from '@/modules/payments/stripe';
import { privilegedDatabase } from '@/server/db';
export async function POST(request:Request) {
  const signature=request.headers.get('stripe-signature');
  if(!signature) return Response.json({error:'Signature required'},{status:400});
  let event;
  try { event=verifyStripeEvent(await request.text(),signature); }
  catch { return Response.json({error:'Invalid webhook'},{status:400}); }
  // Durable inbox only in this milestone. Later processing must reconcile booking,
  // customer, amount, currency and provider object before changing payment state.
  try {
    const {error}=await privilegedDatabase().from('webhook_events').upsert({provider:'stripe',event_id:event.id,event_type:event.type,payload:event},
      {onConflict:'provider,event_id',ignoreDuplicates:true});
    if(error) throw error;
    return Response.json({received:true});
  } catch { return Response.json({error:'Webhook storage unavailable'},{status:503}); }
}
