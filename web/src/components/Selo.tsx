import { ROTULO_SITUACAO_MESA, ROTULO_STATUS_COMANDA, ROTULO_STATUS_PEDIDO } from '@/lib/formato';
import type { SituacaoMesa, StatusComanda, StatusPedido } from '@/lib/tipos';

const COR_PEDIDO: Record<StatusPedido, string> = {
  PENDENTE: 'tomate',
  EM_PREPARO: 'acafrao',
  PRONTO: 'manjericao',
  ENTREGUE: 'grafite',
  CANCELADO: 'neutro',
};
const COR_COMANDA: Record<StatusComanda, string> = {
  ABERTA: 'grafite',
  FECHAMENTO_SOLICITADO: 'acafrao',
  FECHADA: 'manjericao',
  CANCELADA: 'neutro',
};
const COR_MESA: Record<SituacaoMesa, string> = {
  LIVRE: 'manjericao',
  OCUPADA: 'grafite',
  AGUARDANDO_FECHAMENTO: 'acafrao',
};

type Props =
  | { tipo: 'pedido'; status: StatusPedido }
  | { tipo: 'comanda'; status: StatusComanda }
  | { tipo: 'mesa'; status: SituacaoMesa };

/** Selo colorido de status, com o mesmo vocabulário em todas as telas. */
export function Selo(props: Props) {
  const [cor, rotulo] =
    props.tipo === 'pedido'
      ? [COR_PEDIDO[props.status], ROTULO_STATUS_PEDIDO[props.status]]
      : props.tipo === 'comanda'
        ? [COR_COMANDA[props.status], ROTULO_STATUS_COMANDA[props.status]]
        : [COR_MESA[props.status], ROTULO_SITUACAO_MESA[props.status]];
  return <span className={`selo ${cor}`}>{rotulo}</span>;
}
