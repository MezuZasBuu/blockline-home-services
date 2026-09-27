import { z } from 'zod';
import { authenticate } from '@/modules/auth/server';
import { failure, HttpError } from '@/server/http';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  try {
    const {db,actor}=await authenticate(request);
    if(actor.role!=='contractor') throw new HttpError(403,'Forbidden');
    const id=z.uuid().parse((await params).id);
    const {data,error}=await db.rpc('contractor_assignment',{p_id:id});
    if(error) throw new HttpError(404,'Assignment unavailable');
    return Response.json(data,{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return failure(error); }
}
