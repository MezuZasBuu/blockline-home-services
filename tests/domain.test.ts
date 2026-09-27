import { describe,expect,it } from 'vitest';
import { settings } from './fixtures';
import { settingsSchema } from '../src/modules/configuration/schema';
import { canAdminister,canDispatch } from '../src/modules/auth/authorize';
import { capabilityHash,newCapability } from '../src/modules/guests/tokens';
import { deferredChargeParameters,setupSessionParameters } from '../src/modules/payments/architecture';
import { assertSameOrigin } from '../src/server/http';

describe('configuration',()=>{
 it('accepts configurable economics unrelated to illustrative plan numbers',()=>{expect(settingsSchema.parse(settings).customerPriceCents).toBe(17700);});
 it('rejects incomplete economics and orphan surcharges',()=>{
  expect(settingsSchema.safeParse({...settings,customerPriceCents:null}).success).toBe(false);
  expect(settingsSchema.safeParse({...settings,surcharges:[]}).success).toBe(false);
  expect(settingsSchema.safeParse({...settings,minimumMarginBps:10001}).success).toBe(false);
 });
});
it('staff permissions require an active privileged account and MFA',()=>{
 expect(canAdminister({id:'a',role:'admin',active:true,aal:'aal1'})).toBe(false);
 expect(canAdminister({id:'a',role:'dispatcher',active:true,aal:'aal2'})).toBe(false);
 expect(canDispatch({id:'a',role:'dispatcher',active:true,aal:'aal2'})).toBe(true);
 expect(canDispatch({id:'a',role:'admin',active:false,aal:'aal2'})).toBe(false);
});
it('uses unpredictable, hash-only capabilities',()=>{
 const a=newCapability(),b=newCapability(); expect(a).not.toBe(b);expect(a).toHaveLength(43);
 expect(capabilityHash(a)).toHaveLength(64);expect(capabilityHash(a)).not.toBe(a);
 expect(()=>capabilityHash('short')).toThrow();
});
it('blocks cross-origin guest exchanges',()=>{
 process.env.APP_ORIGIN='https://blockline.example';
 expect(()=>assertSameOrigin(new Request('https://blockline.example/api',{headers:{origin:'https://attacker.example'}}))).toThrow('Forbidden');
 expect(()=>assertSameOrigin(new Request('https://blockline.example/api',{headers:{origin:'https://blockline.example'}}))).not.toThrow();
});
describe('deferred payment architecture',()=>{
 const input={policy:settings.paymentPolicy,bookingId:'booking',verifiedAt:'2026-09-25T00:00:00Z',methodStatus:'ready' as const,
 stripeCustomerId:'cus_test',paymentMethodId:'pm_test',amountCents:17700,consentAt:'2026-09-24T00:00:00Z'};
 it('uses setup mode without a charge to save payment details',()=>{
  const params=setupSessionParameters({bookingId:'booking',stripeCustomerId:'cus_test',successUrl:'https://example.invalid/success',cancelUrl:'https://example.invalid/cancel',consentVersion:'v1'});
  expect(params.mode).toBe('setup');expect(params).not.toHaveProperty('line_items');
 });
 it('allows an off-session charge only after verification, consent and method readiness',()=>{
  expect(deferredChargeParameters(input)).toMatchObject({off_session:true,amount:17700,payment_method:'pm_test'});
  expect(()=>deferredChargeParameters({...input,verifiedAt:null})).toThrow();
  expect(()=>deferredChargeParameters({...input,consentAt:null})).toThrow();
  expect(()=>deferredChargeParameters({...input,methodStatus:'pending'})).toThrow();
  expect(()=>deferredChargeParameters({...input,policy:{...input.policy,mode:'pay_after_verification'}})).toThrow();
 });
});
