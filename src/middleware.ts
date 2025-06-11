import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(req: NextRequest) {
  // 如果是根路径、登录页面或者博客详情页，直接放行
  if (
    req.nextUrl.pathname === '/' ||
    req.nextUrl.searchParams.get('login') === 'true' ||
    req.nextUrl.pathname.startsWith('/blog/') // Allow access to /blog/[bid] paths
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL('/?login=true', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
