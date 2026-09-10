import { NextResponse, type NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  // Temporary bypass: allows UI development without active database queries
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};