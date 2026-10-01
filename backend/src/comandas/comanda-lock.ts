import { NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';

/**
 * Bloqueia a linha da comanda (SELECT ... FOR UPDATE) até o fim da transação.
 * Serializa operações concorrentes sobre a mesma comanda — por exemplo, um
 * pedido sendo lançado enquanto o fechamento é solicitado.
 */
export async function bloquearComanda(
  tx: Prisma.TransactionClient,
  comandaId: number,
) {
  await tx.$queryRaw`SELECT id FROM comandas WHERE id = ${comandaId} FOR UPDATE`;
  const comanda = await tx.comanda.findUnique({ where: { id: comandaId } });
  if (!comanda) {
    throw new NotFoundException(`Comanda ${comandaId} não encontrada`);
  }
  return comanda;
}
