import { StatusPedido } from '../generated/prisma/enums.js';
import { podeTransicionar, TRANSICOES_PEDIDO } from './pedido-status.js';

describe('Máquina de estados do pedido', () => {
  it('segue o fluxo PENDENTE → EM_PREPARO → PRONTO → ENTREGUE', () => {
    expect(podeTransicionar('PENDENTE', 'EM_PREPARO')).toBe(true);
    expect(podeTransicionar('EM_PREPARO', 'PRONTO')).toBe(true);
    expect(podeTransicionar('PRONTO', 'ENTREGUE')).toBe(true);
  });

  it('não permite pular etapas nem voltar', () => {
    expect(podeTransicionar('PENDENTE', 'PRONTO')).toBe(false);
    expect(podeTransicionar('PENDENTE', 'ENTREGUE')).toBe(false);
    expect(podeTransicionar('PRONTO', 'EM_PREPARO')).toBe(false);
  });

  it('só permite cancelar antes do preparo', () => {
    expect(podeTransicionar('PENDENTE', 'CANCELADO')).toBe(true);
    expect(podeTransicionar('EM_PREPARO', 'CANCELADO')).toBe(false);
    expect(podeTransicionar('PRONTO', 'CANCELADO')).toBe(false);
  });

  it('trata ENTREGUE e CANCELADO como estados finais', () => {
    expect(TRANSICOES_PEDIDO[StatusPedido.ENTREGUE]).toHaveLength(0);
    expect(TRANSICOES_PEDIDO[StatusPedido.CANCELADO]).toHaveLength(0);
  });
});
