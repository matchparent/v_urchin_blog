import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default async function middleware(req: NextRequest) {
  // 如果是根路径、登录页面、API 路由或者博客详情页，直接放行
  if (
    req.nextUrl.pathname === '/' ||
    req.nextUrl.searchParams.get('login') === 'true' ||
    req.nextUrl.pathname.startsWith('/blog/') || // Allow access to /blog/[bid] paths
    req.nextUrl.pathname.startsWith('/api/') // Allow access to API routes
  ) {
    return NextResponse.next();
  }

  // 检查是否有 session cookie
  const sessionToken =
    req.cookies.get('next-auth.session-token') ||
    req.cookies.get('__Secure-next-auth.session-token');

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/?login=true', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
