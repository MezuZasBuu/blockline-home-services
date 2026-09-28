import { loadAppEnv } from './load-app-env.mjs';

loadAppEnv();

const required = [
  'SUPABASE_URL',
  'SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'APP_ORIGIN',
];

const missing = required.filter(name => !process.env[name]?.trim());
if (missing.length) {
  console.error('Missing environment variables:', missing.join(', '));
  console.error('Add them to .env.local (or .env.staging.local) from the Supabase project linked to this repo.');
  process.exit(1);
}

const url = process.env.SUPABASE_URL.replace(/\/$/, '');
const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function probe(label, key) {
  const response = await fetch(`${url}/rest/v1/`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const ok = response.status !== 401;
  console.log(`${label}: HTTP ${response.status}${ok ? ' (ok)' : ' (failed — check key and project)'}`);
  return ok;
}

const authHealth = await fetch(`${url}/auth/v1/health`);
console.log(`Auth health: HTTP ${authHealth.status}${authHealth.ok ? ' (ok)' : ''}`);

const publishableOk = await probe('Publishable API', publishable);
const serviceOk = await probe('Service role API', serviceRole);

if (!publishableOk || !serviceOk) {
  console.error('\nKeys must belong to the same Supabase project as SUPABASE_URL.');
  console.error('Dashboard → Project Settings → API: use the publishable key and secret (sb_secret_) in SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

if (process.env.SUPABASE_DB_URL?.trim()) {
  console.log('SUPABASE_DB_URL is set (use with `pnpm db:migration:list` / `pnpm db:push:dry-run`).');
} else {
  console.log('SUPABASE_DB_URL is not set (optional for the Next.js app; required for CLI db push).');
}

console.log('\nSupabase environment looks wired. Run hosted migration checks before applying schema.');
