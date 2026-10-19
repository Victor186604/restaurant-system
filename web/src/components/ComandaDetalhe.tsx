import { Selo } from './Selo';
import { formatarDataHora, formatarHora, formatarMoeda } from '@/lib/formato';
import type { ComandaDetalhe as Comanda } from '@/lib/tipos';
import { EstadoVazio } from './Estados';

/** Pedidos e itens de uma comanda (usado no salão e na tela de comandas). */
export function PedidosDaComanda({ comanda }: { comanda: Comanda }) {
  if (comanda.pedidos.length === 0) {
    return <EstadoVazio titulo="Nenhum pedido lançado">O garçom lança os pedidos pelo aplicativo.</EstadoVazio>;
  }
  return (
    <div className="caixa">
      <h2>Pedidos</h2>
      {comanda.pedidos.map((pedido) => (
        <section key={pedido.id} className="pedido-bloco" aria-label={`Pedido ${pedido.id}`}>
          <header>
            <h3>
              Pedido #{pedido.id} <span className="texto-2">· {formatarHora(pedido.criadoEm)}</span>
            </h3>
            <Selo tipo="pedido" status={pedido.status} />
          </header>
          {pedido.observacao ? <p className="texto-2">Obs.: {pedido.observacao}</p> : null}
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th className="valor">Qtd.</th>
                <th className="valor">Unitário</th>
                <th className="valor">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens.map((item) => (
                <tr key={item.id}>
                  <td>
                    {item.produto.nome}
                    {item.observacao ? <div className="texto-2">{item.observacao}</div> : null}
                  </td>
                  <td className="valor">{item.quantidade}</td>
                  <td className="valor">{formatarMoeda(item.precoUnitario)}</td>
                  <td className="valor">{formatarMoeda(item.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}

/** Resumo financeiro: todos os valores vêm calculados da API. */
export function ResumoDaComanda({ comanda }: { comanda: Comanda }) {
  const fechada = comanda.status === 'FECHADA';
  return (
    <div className="caixa">
      <div className="acoes" style={{ justifyContent: 'space-between' }}>
        <h2>Comanda #{comanda.id}</h2>
        <Selo tipo="comanda" status={comanda.status} />
      </div>
      <dl className="dados">
        <dt>Mesa</dt>
        <dd>{comanda.mesa.numero}</dd>
        <dt>Cliente</dt>
        <dd>{comanda.nomeCliente ?? '—'}</dd>
        <dt>Garçom</dt>
        <dd>{comanda.garcom?.nome ?? '—'}</dd>
        <dt>Aberta em</dt>
        <dd>{formatarDataHora(comanda.abertaEm)}</dd>
        {comanda.fechamentoSolicitadoEm ? (
          <>
            <dt>Conta pedida</dt>
            <dd>{formatarDataHora(comanda.fechamentoSolicitadoEm)}</dd>
          </>
        ) : null}
        {comanda.fechadaEm ? (
          <>
            <dt>Fechada em</dt>
            <dd>{formatarDataHora(comanda.fechadaEm)}</dd>
          </>
        ) : null}
        <dt>Pedidos</dt>
        <dd>{comanda.resumo.quantidadePedidos}</dd>
        <dt>Entregue</dt>
        <dd>{formatarMoeda(comanda.resumo.valorEntregue)}</dd>
        <dt>Em andamento</dt>
        <dd>{formatarMoeda(comanda.resumo.valorEmAndamento)}</dd>
      </dl>
      <div className="total">
        <span>{fechada ? 'Total pago' : 'Total previsto'}</span>
        <strong>{formatarMoeda(fechada ? comanda.total : comanda.resumo.valorPrevisto)}</strong>
      </div>
    </div>
  );
}
