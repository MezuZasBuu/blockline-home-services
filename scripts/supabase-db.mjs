import { spawnSync } from 'node:child_process';
import { loadAppEnv } from './load-app-env.mjs';

loadAppEnv();

const dbUrl = process.env.SUPABASE_DB_URL?.trim();
if (!dbUrl) {
  console.error('SUPABASE_DB_URL is required for Supabase CLI database commands.');
  console.error('Use the Session Pooler URL from the linked project (port 5432).');
  process.exit(1);
}

const cliArgs = process.argv.slice(2);
if (!cliArgs.length) {
  console.error('Usage: node scripts/supabase-db.mjs <supabase-cli-args...>');
  process.exit(1);
}

const result = spawnSync('npx', ['supabase@2.118.0', ...cliArgs, '--db-url', dbUrl], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
