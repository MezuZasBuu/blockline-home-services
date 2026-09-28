import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadAppEnv } from '../src/server/load-app-env';

const previous = { ...process.env };

afterEach(() => {
  process.env = { ...previous };
});

describe('loadAppEnv', () => {
  it('loads staging first and lets local override', () => {
    const dir = mkdtempSync(join(tmpdir(), 'blockline-env-'));
    writeFileSync(join(dir, '.env.staging.local'), 'SUPABASE_URL=https://staging.example\nAPP_ORIGIN=http://127.0.0.1:3100\n');
    writeFileSync(join(dir, '.env.local'), 'APP_ORIGIN=http://localhost:3000\n');
    loadAppEnv(dir);
    expect(process.env.SUPABASE_URL).toBe('https://staging.example');
    expect(process.env.APP_ORIGIN).toBe('http://localhost:3000');
  });
});
