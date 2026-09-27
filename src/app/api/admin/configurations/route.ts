import { authenticate } from '@/modules/auth/server';
import { canAdminister } from '@/modules/auth/authorize';
import { configurationInput } from '@/modules/configuration/schema';
import { assertSameOrigin, failure, HttpError, readJson } from '@/server/http';
export async function GET(request:Request) {
  try {
    const {db,actor}=await authenticate(request);
    if(!canAdminister(actor)) throw new HttpError(403,'Forbidden');
    const {data,error}=await db.rpc('admin_configurations');
    if(error) throw error;
    return Response.json(data,{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return failure(error); }
}
export async function POST(request:Request) {
  try {
    assertSameOrigin(request);
    const {db,actor}=await authenticate(request);
    if(!canAdminister(actor)) throw new HttpError(403,'Forbidden');
    const input=configurationInput.parse(await readJson(request));
    const {data,error}=await db.rpc('create_configuration',{p_service:input.serviceId,p_effective_at:input.effectiveAt,p_settings:input.settings});
    if(error) throw error;
    return Response.json({id:data},{status:201});
  } catch(error) { return failure(error); }
}
