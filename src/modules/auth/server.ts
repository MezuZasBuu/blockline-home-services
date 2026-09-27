import 'server-only';
import { userDatabase } from '@/server/db';
import { HttpError } from '@/server/http';
import type { VerifiedActor, Role } from './authorize';
export async function authenticate(request: Request) {
  const header=request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) throw new HttpError(401,'Authentication required');
  const token=header.slice(7);
  const db=userDatabase(token);
  // getUser checks with Auth; getClaims verifies the assurance claim. Never trust getSession or metadata roles.
  const {data:user,error:userError}=await db.auth.getUser(token);
  const {data:claims,error:claimError}=await db.auth.getClaims(token);
  if (userError || claimError || !user.user || !claims || claims.claims.sub!==user.user.id) throw new HttpError(401,'Invalid session');
  const {data:profile,error}=await db.from('profiles').select('role,active').eq('id',user.user.id).single();
  if(error || !profile?.active) throw new HttpError(403,'Forbidden');
  const actor:VerifiedActor={id:user.user.id,role:profile.role as Role,active:profile.active,aal:String(claims.claims.aal)};
  return {db,actor};
}
