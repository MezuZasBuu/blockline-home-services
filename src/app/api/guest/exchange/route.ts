import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertSameOrigin, failure, readJson } from '@/server/http';
import { capabilitySchema } from '@/modules/guests/tokens';
import { exchangeAppointmentAccess } from '@/modules/guests/service';
export async function POST(request:Request) {
  try {
    assertSameOrigin(request);
    const {token}=z.strictObject({token:capabilitySchema}).parse(await readJson(request));
    const session=await exchangeAppointmentAccess(token);
    const response=NextResponse.json({ok:true});
    response.cookies.set('blockline_appointment',session,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',path:'/api/guest',maxAge:86400});
    response.headers.set('Cache-Control','no-store');
    return response;
  } catch(error) { return failure(error); }
}
