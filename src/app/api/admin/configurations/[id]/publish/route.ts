import { z } from 'zod';
import { authenticate } from '@/modules/auth/server';
import { canAdminister } from '@/modules/auth/authorize';
import { settingsSchema } from '@/modules/configuration/schema';
import { assertSameOrigin, failure, HttpError } from '@/server/http';
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    assertSameOrigin(request);
    const {db,actor}=await authenticate(request);
    if(!canAdminister(actor)) throw new HttpError(403,'Forbidden');
    const id=z.uuid().parse((await params).id);
    const {data:versions,error:readError}=await db.rpc('admin_configurations');
    if(readError) throw readError;
    const version=(versions as {id:string;settings:unknown}[]).find(x=>x.id===id);
    if(!version) throw new HttpError(404,'Configuration not found');
    settingsSchema.parse(version.settings);
    const {error}=await db.rpc('publish_configuration',{p_id:id});
    if(error) throw error;
    return Response.json({ok:true});
  } catch(error) { return failure(error); }
}
