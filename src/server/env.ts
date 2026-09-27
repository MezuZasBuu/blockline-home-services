import 'server-only';
import { z } from 'zod';
export function databaseEnv() {
  return z.object({SUPABASE_URL:z.url(),SUPABASE_PUBLISHABLE_KEY:z.string().min(1)}).parse(process.env);
}
export function origin() { return z.url().parse(process.env.APP_ORIGIN); }
export function requiredSecret(name: 'SUPABASE_SERVICE_ROLE_KEY'|'STRIPE_SECRET_KEY'|'STRIPE_WEBHOOK_SECRET') {
  return z.string().min(1).parse(process.env[name]);
}
