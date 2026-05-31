import { kv } from '@vercel/kv';
import { appendFile, mkdir } from 'fs/promises';
import path from 'path';

export type WaitlistRole = 'creator' | 'brand' | 'trader' | 'other';

export interface WaitlistSignup {
  email: string;
  role: WaitlistRole;
  createdAt: string;
  source: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

function hasKvConfig(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function saveToLocalFile(signup: WaitlistSignup): Promise<void> {
  const dir = path.join(process.cwd(), '..', 'ops', 'waitlist');
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, 'signups.jsonl');
  await appendFile(file, `${JSON.stringify(signup)}\n`, 'utf8');
}

export async function saveWaitlistSignup(
  signup: WaitlistSignup
): Promise<'created' | 'exists'> {
  const normalized = signup.email.trim().toLowerCase();

  if (hasKvConfig()) {
    const key = `waitlist:${normalized}`;
    const existing = await kv.get<WaitlistSignup>(key);
    if (existing) return 'exists';

    await kv.set(key, { ...signup, email: normalized });
    await kv.sadd('waitlist:all', normalized);
    return 'created';
  }

  if (process.env.NODE_ENV === 'development') {
    await saveToLocalFile({ ...signup, email: normalized });
    return 'created';
  }

  throw new Error(
    'Waitlist storage is not configured. Add Vercel Redis (KV_REST_API_URL + KV_REST_API_TOKEN).'
  );
}
