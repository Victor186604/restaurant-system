import type { SituacaoMesa, Mesa, StatusComanda, StatusPedido } from './tipos';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});
const hora = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Sao_Paulo',
});

/** Formata para exibição o valor já calculado pela API (string "64.90"). */
export const formatarMoeda = (valor: string | null | undefined) =>
  valor == null ? '—' : moeda.format(Number(valor));
export const formatarDataHora = (iso: string | null | undefined) =>
  iso ? dataHora.format(new Date(iso)) : '—';
export const formatarHora = (iso: string | null | undefined) => (iso ? hora.format(new Date(iso)) : '—');

/** Minutos decorridos entre dois instantes (para "há 12 min" nos pedidos). */
export function minutosDesde(iso: string, agora: number): number {
  return Math.max(0, Math.floor((agora - new Date(iso).getTime()) / 60000));
}

export function situacaoDaMesa(mesa: Mesa): SituacaoMesa {
  if (mesa.comandaAtiva?.status === 'FECHAMENTO_SOLICITADO') return 'AGUARDANDO_FECHAMENTO';
  return mesa.status === 'OCUPADA' || mesa.comandaAtiva ? 'OCUPADA' : 'LIVRE';
}

export const ROTULO_SITUACAO_MESA: Record<SituacaoMesa, string> = {
  LIVRE: 'Livre',
  OCUPADA: 'Ocupada',
  AGUARDANDO_FECHAMENTO: 'Aguardando fechamento',
};

export const ROTULO_STATUS_COMANDA: Record<StatusComanda, string> = {
  ABERTA: 'Aberta',
  FECHAMENTO_SOLICITADO: 'Aguardando fechamento',
  FECHADA: 'Fechada',
  CANCELADA: 'Cancelada',
};

export const ROTULO_STATUS_PEDIDO: Record<StatusPedido, string> = {
  PENDENTE: 'Pendente',
  EM_PREPARO: 'Em preparo',
  PRONTO: 'Pronto',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};
