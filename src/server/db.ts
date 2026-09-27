import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { databaseEnv, requiredSecret } from './env';
export function userDatabase(token: string) {
  const env=databaseEnv();
  return createClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{
    auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:`Bearer ${token}`}},
  });
}
// Only internal capability and webhook repositories use this bypass-RLS client.
export function privilegedDatabase() {
  return createClient(databaseEnv().SUPABASE_URL,requiredSecret('SUPABASE_SERVICE_ROLE_KEY'),{
    auth:{persistSession:false,autoRefreshToken:false},
  });
}
