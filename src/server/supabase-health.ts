import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { databaseEnv, requiredSecret } from './env';

export type SupabaseHealthCheck = { ok: boolean; status: number };
export type SupabaseHealth = {
  ok: boolean;
  projectUrl: string;
  checks: {
    authHealth: SupabaseHealthCheck;
    publishableApi: SupabaseHealthCheck;
    serviceRoleApi: SupabaseHealthCheck;
  };
};

async function probeRestApi(url: string, apiKey: string): Promise<SupabaseHealthCheck> {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: apiKey, Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
  });
  return { ok: response.status !== 401, status: response.status };
}

export async function checkSupabaseHealth(): Promise<SupabaseHealth> {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = databaseEnv();
  const serviceRoleKey = requiredSecret('SUPABASE_SERVICE_ROLE_KEY');
  const authHealthResponse = await fetch(`${SUPABASE_URL}/auth/v1/health`, { cache: 'no-store' });
  const authHealth: SupabaseHealthCheck = { ok: authHealthResponse.ok, status: authHealthResponse.status };
  const [publishableApi, serviceRoleApi] = await Promise.all([
    probeRestApi(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY),
    probeRestApi(SUPABASE_URL, serviceRoleKey),
  ]);
  const ok = authHealth.ok && publishableApi.ok && serviceRoleApi.ok;
  return { ok, projectUrl: SUPABASE_URL, checks: { authHealth, publishableApi, serviceRoleApi } };
}

/** Confirms the service-role client can reach PostgREST (does not prove RLS). */
export async function checkSupabaseDatabaseReachable(): Promise<SupabaseHealthCheck> {
  const env = databaseEnv();
  const client = createClient(env.SUPABASE_URL, requiredSecret('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await client.from('services').select('id').limit(1);
  if (!error) return { ok: true, status: 200 };
  if (error.code === 'PGRST205' || /Could not find the table/i.test(error.message)) {
    return { ok: false, status: 424 };
  }
  return { ok: false, status: 503 };
}
