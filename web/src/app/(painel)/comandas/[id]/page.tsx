import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { carregar, exigirUsuario } from '@/lib/sessao';
import { PERFIS_GERENCIA, podeFecharComanda } from '@/lib/permissoes';
import { formatarMoeda } from '@/lib/formato';
import { Cabecalho } from '@/components/Cabecalho';
import { Aviso, EstadoErro } from '@/components/Estados';
import { PedidosDaComanda, ResumoDaComanda } from '@/components/ComandaDetalhe';
import { FecharComanda } from './FecharComanda';

export const metadata: Metadata = { title: 'Comanda' };

export default async function PaginaComanda({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string }>;
}) {
  const usuario = await exigirUsuario(PERFIS_GERENCIA);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const comanda = await carregar(api.comandas.buscar(id));
  const voltar = { href: '/comandas', rotulo: 'Comandas' };
  if (comanda.erro !== undefined) {
    if (comanda.status === 404) notFound();
    return (
      <>
        <Cabecalho titulo={`Comanda #${id}`} voltar={voltar} />
        <EstadoErro mensagem={comanda.erro} status={comanda.status} />
      </>
    );
  }

  const c = comanda.dados;
  const ativa = c.status === 'ABERTA' || c.status === 'FECHAMENTO_SOLICITADO';
  const fechouAgora = (await searchParams).ok === 'fechada' && c.status === 'FECHADA';

  return (
    <>
      <Cabecalho titulo={`Comanda #${c.id}`} descricao={`Mesa ${c.mesa.numero}`} voltar={voltar} />
      {fechouAgora ? (
        <Aviso tipo="sucesso">
          Comanda #{c.id} fechada no valor de {formatarMoeda(c.total)}. Mesa {c.mesa.numero} liberada.
        </Aviso>
      ) : null}
      <div className="grade-detalhe">
        <PedidosDaComanda comanda={c} />
        <aside>
          <ResumoDaComanda comanda={c} />
          {ativa ? (
            <div className="caixa">
              <h2>Fechamento</h2>
              {!podeFecharComanda(usuario.perfil) ? (
                <p className="texto-2" style={{ marginTop: '0.5rem' }}>
                  Somente a gerência fecha comandas.
                </p>
              ) : c.resumo.podeFechar ? (
                <div style={{ marginTop: '0.75rem' }}>
                  <FecharComanda id={c.id} total={formatarMoeda(c.resumo.valorPrevisto)} />
                </div>
              ) : (
                <p className="texto-2" style={{ marginTop: '0.5rem' }}>
                  Ainda não pode ser fechada: {c.resumo.pedidosPendentesDeEntrega} pedido(s) não entregue(s). Entregue
                  ou cancele os pedidos antes de fechar.
                </p>
              )}
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
