import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { z } from 'zod';
export const capabilitySchema=z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export function newCapability() { return randomBytes(32).toString('base64url'); }
export function capabilityHash(token:string) { return createHash('sha256').update(capabilitySchema.parse(token)).digest('hex'); }
