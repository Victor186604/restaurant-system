import { Prisma } from '../generated/prisma/client.js';
import { StatusPedido } from '../generated/prisma/enums.js';

/** Itens com o nome do produto, usados em todas as respostas de pedido. */
export const pedidoInclude = {
  itens: {
    include: { produto: { select: { id: true, nome: true } } },
    orderBy: { id: 'asc' },
  },
} as const satisfies Prisma.PedidoInclude;

type ItemComPreco = { quantidade: number; precoUnitario: Prisma.Decimal };

/** Acrescenta `subtotal` em cada item e `total` no pedido. */
export function apresentarPedido<T extends { itens: ItemComPreco[] }>(
  pedido: T,
) {
  const itens = pedido.itens.map((item) => ({
    ...item,
    subtotal: item.precoUnitario.mul(item.quantidade),
  }));
  const total = itens.reduce(
    (soma, item) => soma.add(item.subtotal),
    new Prisma.Decimal(0),
  );
  return { ...pedido, itens, total };
}

/** Soma o valor dos pedidos que entram na conta (todos, exceto os cancelados). */
export function somarPedidos(
  pedidos: { status: StatusPedido; total: Prisma.Decimal }[],
) {
  return pedidos
    .filter((pedido) => pedido.status !== StatusPedido.CANCELADO)
    .reduce((soma, pedido) => soma.add(pedido.total), new Prisma.Decimal(0));
}

/** Status que ainda exigem ação da cozinha ou do garçom. */
export const STATUS_PEDIDO_EM_ANDAMENTO: StatusPedido[] = [
  StatusPedido.PENDENTE,
  StatusPedido.EM_PREPARO,
  StatusPedido.PRONTO,
];
