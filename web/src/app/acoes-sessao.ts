'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { COOKIE_SESSAO } from '@/lib/constantes';
import { paginaInicial } from '@/lib/permissoes';
import { destinoSeguro } from '@/lib/sessao';

export type EstadoLogin = { erro?: string; email?: string };

function cookieSeguro(): boolean {
  const valor = process.env.COOKIE_SECURE;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  return process.env.NODE_ENV === 'production';
}

/** Autentica na API e guarda o JWT em cookie httpOnly (inacessível ao JavaScript do navegador). */
export async function entrar(_anterior: EstadoLogin, form: FormData): Promise<EstadoLogin> {
  const email = String(form.get('email') ?? '').trim();
  const senha = String(form.get('senha') ?? '');
  if (!email || !senha) return { erro: 'Informe e-mail e senha.', email };

  let resposta;
  try {
    resposta = await api.auth.login(email, senha);
  } catch (erro) {
    if (erro instanceof ApiError) {
      return {
        erro: erro.status === 401 ? 'E-mail ou senha inválidos.' : erro.message,
        email,
      };
    }
    throw erro;
  }

  (await cookies()).set(COOKIE_SESSAO, resposta.accessToken, {
    httpOnly: true,
    sameSite: 'lax',
    secure: cookieSeguro(),
    path: '/',
    maxAge: resposta.expiresIn,
  });
  redirect(destinoSeguro(form.get('next')) ?? paginaInicial(resposta.usuario.perfil));
}

export async function sair() {
  (await cookies()).delete(COOKIE_SESSAO);
  redirect('/login');
}
