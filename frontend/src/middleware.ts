import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import {
  getReleaseStage,
  isRouteAllowed,
  shouldEnforceReleaseGating,
} from '@/lib/release-stage';

export function middleware(request: NextRequest) {
  if (!shouldEnforceReleaseGating()) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const stage = getReleaseStage();

  if (isRouteAllowed(pathname, stage)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  url.searchParams.set('soon', stage === 'landing' ? 'demo' : stage);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
