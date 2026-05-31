import { NextResponse } from 'next/server';
import {
  isValidEmail,
  saveWaitlistSignup,
  type WaitlistRole,
} from '@/lib/waitlist';

const VALID_ROLES: WaitlistRole[] = ['creator', 'brand', 'trader', 'other'];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, role, website } = body as {
      email?: string;
      role?: string;
      website?: string;
    };

    // Honeypot — bots fill hidden fields
    if (website) {
      return NextResponse.json({ ok: true, message: "You're on the list!" });
    }

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const safeRole: WaitlistRole = VALID_ROLES.includes(role as WaitlistRole)
      ? (role as WaitlistRole)
      : 'other';

    const result = await saveWaitlistSignup({
      email,
      role: safeRole,
      createdAt: new Date().toISOString(),
      source: 'landing',
    });

    return NextResponse.json({
      ok: true,
      message:
        result === 'exists'
          ? "You're already on the waitlist!"
          : "You're on the list! We'll notify you when we launch.",
    });
  } catch (err) {
    console.error('[waitlist]', err);
    return NextResponse.json(
      { error: 'Unable to join waitlist right now. Please try again later.' },
      { status: 500 }
    );
  }
}
