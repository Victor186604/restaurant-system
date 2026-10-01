import { StatusPedido } from '../generated/prisma/enums.js';

/**
 * Máquina de estados do pedido.
 *
 *   PENDENTE ──► EM_PREPARO ──► PRONTO ──► ENTREGUE
 *       │
 *       └──────► CANCELADO
 *
 * ENTREGUE e CANCELADO são estados finais. O cancelamento só é permitido
 * antes de a cozinha iniciar o preparo.
 */
export const TRANSICOES_PEDIDO: Record<StatusPedido, readonly StatusPedido[]> =
  {
    [StatusPedido.PENDENTE]: [StatusPedido.EM_PREPARO, StatusPedido.CANCELADO],
    [StatusPedido.EM_PREPARO]: [StatusPedido.PRONTO],
    [StatusPedido.PRONTO]: [StatusPedido.ENTREGUE],
    [StatusPedido.ENTREGUE]: [],
    [StatusPedido.CANCELADO]: [],
  };

/** Pedidos que ainda impedem o fechamento da comanda. */
export const STATUS_PEDIDO_EM_ANDAMENTO: StatusPedido[] = [
  StatusPedido.PENDENTE,
  StatusPedido.EM_PREPARO,
  StatusPedido.PRONTO,
];

/** Pedidos exibidos na fila da cozinha. */
export const STATUS_PEDIDO_COZINHA: StatusPedido[] = [
  StatusPedido.PENDENTE,
  StatusPedido.EM_PREPARO,
];

export function podeTransicionar(de: StatusPedido, para: StatusPedido) {
  return TRANSICOES_PEDIDO[de].includes(para);
}

/** Campo de data/hora preenchido ao entrar em cada status. */
export const CAMPO_DATA_STATUS: Partial<
  Record<StatusPedido, 'iniciadoEm' | 'prontoEm' | 'entregueEm' | 'canceladoEm'>
> = {
  [StatusPedido.EM_PREPARO]: 'iniciadoEm',
  [StatusPedido.PRONTO]: 'prontoEm',
  [StatusPedido.ENTREGUE]: 'entregueEm',
  [StatusPedido.CANCELADO]: 'canceladoEm',
};
