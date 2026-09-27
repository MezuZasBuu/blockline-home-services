import { beforeEach,describe,expect,it,vi } from 'vitest';
import Stripe from 'stripe';
const mocks=vi.hoisted(()=>({upsert:vi.fn(),privileged:vi.fn(),userDb:vi.fn(),getUser:vi.fn(),getClaims:vi.fn(),single:vi.fn()}));
vi.mock('@/server/db',()=>({privilegedDatabase:mocks.privileged,userDatabase:mocks.userDb}));
import { POST as webhook } from '../src/app/api/stripe/webhook/route';
import { POST as exchange } from '../src/app/api/guest/exchange/route';
import { authenticate } from '../src/modules/auth/server';

beforeEach(()=>{
 vi.clearAllMocks();
 process.env.STRIPE_SECRET_KEY='sk_test_local_fixture';process.env.STRIPE_WEBHOOK_SECRET='whsec_local_fixture';
 process.env.APP_ORIGIN='https://blockline.example';
 mocks.privileged.mockReturnValue({from:()=>({upsert:mocks.upsert})});
 mocks.upsert.mockResolvedValue({error:null});
 mocks.userDb.mockReturnValue({auth:{getUser:mocks.getUser,getClaims:mocks.getClaims},from:()=>({select:()=>({eq:()=>({single:mocks.single})})})});
 mocks.getUser.mockResolvedValue({data:{user:{id:'verified-user',user_metadata:{role:'admin'}}},error:null});
 mocks.getClaims.mockResolvedValue({data:{claims:{sub:'verified-user',aal:'aal1'}},error:null});
 mocks.single.mockResolvedValue({data:{role:'contractor',active:true},error:null});
});
function signedRequest(payload:string) {
 const stripe=new Stripe('sk_test_local_fixture');
 const signature=stripe.webhooks.generateTestHeaderString({payload,secret:'whsec_local_fixture'});
 return new Request('https://blockline.example/api/stripe/webhook',{method:'POST',body:payload,headers:{'stripe-signature':signature}});
}
describe('Stripe webhook boundary',()=>{
 it('rejects missing/invalid signatures without touching storage',async()=>{
  expect((await webhook(new Request('https://blockline.example',{method:'POST',body:'{}'}))).status).toBe(400);
  expect((await webhook(new Request('https://blockline.example',{method:'POST',body:'{}',headers:{'stripe-signature':'forged'}}))).status).toBe(400);
  expect(mocks.privileged).not.toHaveBeenCalled();
 });
 it('persists only signed events using a duplicate-safe inbox',async()=>{
  const payload=JSON.stringify({id:'evt_test',type:'setup_intent.succeeded',object:'event',data:{object:{id:'seti_test'}}});
  expect((await webhook(signedRequest(payload))).status).toBe(200);
  expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({event_id:'evt_test',provider:'stripe'}),{onConflict:'provider,event_id',ignoreDuplicates:true});
 });
 it('requests retry if durable storage fails',async()=>{
  mocks.upsert.mockResolvedValue({error:new Error('private database detail')});
  const response=await webhook(signedRequest(JSON.stringify({id:'evt_test',type:'payment_intent.succeeded'})));
  expect(response.status).toBe(503);expect(await response.text()).not.toContain('private database detail');
 });
});
describe('authentication boundary',()=>{
 it('does not trust user-editable metadata for roles',async()=>{
  const {actor}=await authenticate(new Request('https://blockline.example',{headers:{authorization:'Bearer verified-token'}}));
  expect(actor.role).toBe('contractor');expect(actor.aal).toBe('aal1');
 });
 it('rejects missing or revoked identity and mismatched claims',async()=>{
  await expect(authenticate(new Request('https://blockline.example'))).rejects.toThrow('Authentication required');
  mocks.getUser.mockResolvedValue({data:{user:null},error:new Error('revoked')});
  await expect(authenticate(new Request('https://blockline.example',{headers:{authorization:'Bearer bad'}}))).rejects.toThrow('Invalid session');
  mocks.getUser.mockResolvedValue({data:{user:{id:'different-user'}},error:null});
  await expect(authenticate(new Request('https://blockline.example',{headers:{authorization:'Bearer bad'}}))).rejects.toThrow('Invalid session');
 });
 it('rejects cross-origin and malformed guest exchange before privileged access',async()=>{
  const response=await exchange(new Request('https://blockline.example',{method:'POST',body:'{}',headers:{origin:'https://attacker.example'}}));
  expect(response.status).toBe(403);
  const malformed=await exchange(new Request('https://blockline.example',{method:'POST',body:'{"token":"guess"}',headers:{origin:'https://blockline.example'}}));
  expect(malformed.status).toBe(400);expect(mocks.privileged).not.toHaveBeenCalled();
 });
});
