import { NextRequest, NextResponse } from 'next/server';
import {
  checkPaymentAccess,
  findProtectedRoute,
} from './lib/payment-gate';

export default async function proxy(request: NextRequest) {
  const protectedRoute = findProtectedRoute(request.nextUrl.pathname);
  if (!protectedRoute) {
    return NextResponse.next();
  }

  const hasAccess = await checkPaymentAccess(request, protectedRoute.contentId);
  if (hasAccess) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/demo/payment-gated';
  url.searchParams.set('redirect', protectedRoute.path);
  url.searchParams.set('contentId', protectedRoute.contentId);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/payment-gate).*)'],
};
