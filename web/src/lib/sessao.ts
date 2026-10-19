import { cache } from 'react';
import { redirect } from 'next/navigation';
import { api, ApiError } from './api';
import { paginaInicial } from './permissoes';
import type { Perfil, Usuario } from './tipos';

/** Usuário do token, consultado na API uma única vez por requisição. */
export const usuarioAtual = cache((): Promise<Usuario> => api.auth.me());

/**
 * Garante sessão válida (senão vai para /sair, que limpa o cookie) e,
 * se informados, que o perfil está entre os permitidos na página.
 */
export async function exigirUsuario(perfis?: Perfil[]): Promise<Usuario> {
  let usuario: Usuario;
  try {
    usuario = await usuarioAtual();
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 401) redirect('/sair');
    throw erro;
  }
  if (perfis && !perfis.includes(usuario.perfil)) redirect(paginaInicial(usuario.perfil));
  return usuario;
}

type Carregado<T> = { dados: T; erro?: undefined } | { dados?: undefined; erro: string; status: number };

/** Executa uma chamada para uma página: sessão expirada redireciona; outros erros viram mensagem. */
export async function carregar<T>(promessa: Promise<T>): Promise<Carregado<T>> {
  try {
    return { dados: await promessa };
  } catch (erro) {
    if (erro instanceof ApiError) {
      if (erro.status === 401) redirect('/sair');
      return { erro: erro.message, status: erro.status };
    }
    throw erro;
  }
}

export type ResultadoAcao = { ok: true; mensagem?: string } | { ok: false; erro: string };

/** Converte erro de Server Action em resposta para a interface. */
export function erroDeAcao(erro: unknown): ResultadoAcao {
  if (erro instanceof ApiError) {
    if (erro.status === 401) redirect('/sair');
    return { ok: false, erro: erro.message };
  }
  throw erro;
}

/** Aceita apenas caminhos internos (evita redirecionamento aberto). */
export function destinoSeguro(valor: FormDataEntryValue | string | null | undefined): string | null {
  if (typeof valor !== 'string') return null;
  if (!valor.startsWith('/') || valor.startsWith('//') || valor.startsWith('/\\')) return null;
  return valor;
}
