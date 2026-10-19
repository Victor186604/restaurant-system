import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_SESSAO } from './lib/constantes';

/**
 * Primeira barreira: sem cookie de sessão, qualquer página interna vai para
 * o login. A validade do token é conferida pela API em cada página (/auth/me).
 */
export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const temSessao = request.cookies.has(COOKIE_SESSAO);
  const publica = pathname === '/login' || pathname === '/sair';

  if (!temSessao && !publica) {
    const url = new URL('/login', request.url);
    if (pathname !== '/') url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (temSessao && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.svg).*)'],
};
