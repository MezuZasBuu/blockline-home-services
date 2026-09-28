import { checkSupabaseDatabaseReachable, checkSupabaseHealth } from '@/server/supabase-health';

export async function GET() {
  if (process.env.NODE_ENV === 'production') return new Response(null, { status: 404 });
  try {
    const health = await checkSupabaseHealth();
    const database = health.ok ? await checkSupabaseDatabaseReachable() : { ok: false, status: 0 };
    const migrationsApplied = database.status !== 424;
    const body = {
      ...health,
      checks: { ...health.checks, database },
      migrationsApplied,
    };
    return Response.json(body, { status: health.ok && database.ok ? 200 : 503 });
  } catch {
    return Response.json({ ok: false, error: 'Supabase environment is not configured.' }, { status: 503 });
  }
}
