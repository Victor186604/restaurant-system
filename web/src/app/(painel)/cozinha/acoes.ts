'use server';

import { revalidatePath } from 'next/cache';
import { api } from '@/lib/api';
import { erroDeAcao, type ResultadoAcao } from '@/lib/sessao';

/** A cozinha só move pedidos para EM_PREPARO e PRONTO; a API valida perfil e transição. */
export async function moverPedido(id: number, status: 'EM_PREPARO' | 'PRONTO'): Promise<ResultadoAcao> {
  try {
    await api.pedidos.alterarStatus(id, status);
  } catch (erro) {
    return erroDeAcao(erro);
  }
  revalidatePath('/cozinha');
  return { ok: true };
}
