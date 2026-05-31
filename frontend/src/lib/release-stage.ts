export type ReleaseStage = 'landing' | 'demo' | 'portal' | 'trading';

export const STAGE_ORDER: ReleaseStage[] = ['landing', 'demo', 'portal', 'trading'];

export const STAGE_ROUTES: Record<ReleaseStage, string[]> = {
  landing: ['/'],
  demo: ['/', '/demo'],
  portal: [
    '/',
    '/demo',
    '/dashboard',
    '/agents',
    '/matches',
    '/deals',
    '/metrics',
    '/admin',
  ],
  trading: ['/*'],
};

const ALWAYS_ALLOWED_PREFIXES = ['/api', '/_next', '/favicon.ico'];

export function getReleaseStage(): ReleaseStage {
  const raw = process.env.NEXT_PUBLIC_RELEASE_STAGE ?? 'landing';
  if (STAGE_ORDER.includes(raw as ReleaseStage)) {
    return raw as ReleaseStage;
  }
  return 'landing';
}

export function isAlwaysAllowed(pathname: string): boolean {
  return ALWAYS_ALLOWED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(prefix)
  );
}

export function isRouteAllowed(pathname: string, stage: ReleaseStage): boolean {
  if (isAlwaysAllowed(pathname)) return true;

  const allowed = STAGE_ROUTES[stage];

  if (allowed.includes('/*')) return true;

  return allowed.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export function shouldEnforceReleaseGating(): boolean {
  if (process.env.NEXT_PUBLIC_SKIP_RELEASE_GATING === 'true') return false;
  return process.env.VERCEL_ENV === 'production';
}
