import { NotFoundException } from '@nestjs/common';
import { Prisma, StatusComanda } from '../../generated/prisma/client.js';

/**
 * Bloqueia a linha da comanda (SELECT ... FOR UPDATE) até o fim da transação.
 *
 * Toda operação que depende do status da comanda (lançar pedido, solicitar
 * fechamento, fechar, cancelar) passa por aqui. Assim, um pedido lançado no
 * mesmo instante em que a gerência fecha a comanda é serializado: ou o pedido
 * entra antes (e o fechamento é recusado por haver pedido pendente), ou o
 * fechamento acontece antes (e o pedido é recusado por comanda fechada).
 */
export async function travarComanda(
  tx: Prisma.TransactionClient,
  comandaId: number,
): Promise<{ id: number; mesaId: number; status: StatusComanda }> {
  const linhas = await tx.$queryRaw<
    { id: number; mesa_id: number; status: StatusComanda }[]
  >`SELECT id, mesa_id, status FROM comandas WHERE id = ${comandaId} FOR UPDATE`;

  const comanda = linhas[0];
  if (!comanda) {
    throw new NotFoundException(`Comanda ${comandaId} não encontrada.`);
  }
  return { id: comanda.id, mesaId: comanda.mesa_id, status: comanda.status };
}
