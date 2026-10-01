import { Prisma, StatusPedido } from '../generated/prisma/client.js';
import { usuarioResumoSelect } from '../usuarios/usuarios.service.js';

export const pedidoInclude = {
  itens: {
    orderBy: { id: 'asc' },
    include: { produto: { select: { id: true, nome: true } } },
  },
  criadoPor: { select: usuarioResumoSelect },
} satisfies Prisma.PedidoInclude;

/** Versão usada em listagens (cozinha, garçom): inclui a mesa. */
export const pedidoComMesaInclude = {
  ...pedidoInclude,
  comanda: {
    select: {
      id: true,
      status: true,
      nomeCliente: true,
      mesa: { select: { id: true, numero: true } },
    },
  },
} satisfies Prisma.PedidoInclude;

type PedidoBase = Prisma.PedidoGetPayload<{ include: typeof pedidoInclude }>;

/** Acrescenta subtotal por item e total do pedido (valores calculados). */
export function formatarPedido<T extends PedidoBase>(pedido: T) {
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

export type PedidoFormatado = ReturnType<typeof formatarPedido<PedidoBase>>;

export function somarPedidos(
  pedidos: PedidoFormatado[],
  filtro: (status: StatusPedido) => boolean,
) {
  return pedidos
    .filter((p) => filtro(p.status))
    .reduce((soma, p) => soma.add(p.total), new Prisma.Decimal(0));
}
