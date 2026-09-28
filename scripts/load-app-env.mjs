import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export function loadAppEnv(cwd = process.cwd()) {
  applyEnvFile(resolve(cwd, '.env.staging.local'), false);
  applyEnvFile(resolve(cwd, '.env.local'), true);
}

function applyEnvFile(path, override) {
  if (!existsSync(path)) return;
  for (const raw of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const separator = line.indexOf('=');
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (!key) continue;
    if (!override && process.env[key] !== undefined) continue;
    let value = line.slice(separator + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}
