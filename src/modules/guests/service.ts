import 'server-only';
import { privilegedDatabase } from '@/server/db';
import { HttpError } from '@/server/http';
import { capabilityHash, newCapability } from './tokens';
// Called only after a future trusted booking transaction or verified email-recovery flow.
// Deliberately no public route that issues tokens by booking ID/email.
export async function issueAppointmentAccess(bookingId:string) {
  const token=newCapability();
  const {error}=await privilegedDatabase().rpc('issue_guest_token',{p_booking:bookingId,p_hash:capabilityHash(token)});
  if(error) throw new Error('Could not issue access');
  return token;
}
export async function exchangeAppointmentAccess(token:string) {
  const session=newCapability();
  const {error}=await privilegedDatabase().rpc('exchange_guest_token',{p_hash:capabilityHash(token),p_session_hash:capabilityHash(session)});
  if(error) throw new HttpError(401,'Link invalid or expired');
  return session;
}
export async function readAppointment(session:string) {
  const {data,error}=await privilegedDatabase().rpc('guest_appointment',{p_session_hash:capabilityHash(session)});
  if(error) throw new HttpError(401,'Session invalid or expired');
  return data as unknown;
}
