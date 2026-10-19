import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_SESSAO } from '@/lib/constantes';

/**
 * Destino quando a API recusa o token (expirado, usuário desativado):
 * remove o cookie e volta ao login avisando que a sessão expirou.
 */
export function GET(request: NextRequest) {
  const resposta = NextResponse.redirect(new URL('/login?expirou=1', request.url));
  resposta.cookies.delete(COOKIE_SESSAO);
  return resposta;
}
