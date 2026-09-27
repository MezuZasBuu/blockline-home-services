import 'server-only';
import { ZodError } from 'zod';
import { origin } from './env';
export class HttpError extends Error { constructor(public status:number,message:string) { super(message); } }
export function assertSameOrigin(request: Request) {
  if (request.headers.get('origin')!==origin()) throw new HttpError(403,'Forbidden');
}
export async function readJson(request: Request) {
  const body=await request.text();
  if (body.length>32_768) throw new HttpError(413,'Request too large');
  try { return JSON.parse(body) as unknown; } catch { throw new HttpError(400,'Invalid JSON'); }
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return Response.json({error:error.message},{status:error.status});
  if (error instanceof ZodError) return Response.json({error:'Invalid request or configuration'},{status:400});
  // Never return database details, tokens, or provider payloads.
  return Response.json({error:'Unable to complete request'},{status:503});
}
