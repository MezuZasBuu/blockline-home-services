import { cookies } from 'next/headers';
import { failure, HttpError } from '@/server/http';
import { readAppointment } from '@/modules/guests/service';
export async function GET() {
  try {
    const session=(await cookies()).get('blockline_appointment')?.value;
    if(!session) throw new HttpError(401,'Appointment access required');
    return Response.json(await readAppointment(session),{headers:{'Cache-Control':'no-store'}});
  } catch(error) { return failure(error); }
}
