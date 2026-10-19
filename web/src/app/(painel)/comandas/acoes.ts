'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api';
import { erroDeAcao, type ResultadoAcao } from '@/lib/sessao';

/** O fechamento é decidido pela API (perfil, status e pedidos pendentes). */
export async function fecharComanda(id: number, _anterior: ResultadoAcao | null): Promise<ResultadoAcao> {
  try {
    await api.comandas.fechar(id);
  } catch (erro) {
    return erroDeAcao(erro);
  }
  revalidatePath('/comandas');
  revalidatePath('/salao');
  // Após fechar, a comanda deixa de ser ativa e o formulário some da página:
  // a confirmação vai pela URL para continuar visível.
  redirect(`/comandas/${id}?ok=fechada`);
}
