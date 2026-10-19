import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { carregar, exigirUsuario } from '@/lib/sessao';
import { PERFIS_GERENCIA } from '@/lib/permissoes';
import { situacaoDaMesa } from '@/lib/formato';
import { Cabecalho } from '@/components/Cabecalho';
import { EstadoErro, EstadoVazio } from '@/components/Estados';
import { Selo } from '@/components/Selo';
import { PedidosDaComanda, ResumoDaComanda } from '@/components/ComandaDetalhe';

export const metadata: Metadata = { title: 'Mesa' };

export default async function PaginaMesa({ params }: { params: Promise<{ id: string }> }) {
  await exigirUsuario(PERFIS_GERENCIA);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const mesa = await carregar(api.mesas.buscar(id));
  const voltar = { href: '/salao', rotulo: 'Salão' };
  if (mesa.erro !== undefined) {
    if (mesa.status === 404) notFound();
    return (
      <>
        <Cabecalho titulo="Mesa" voltar={voltar} />
        <EstadoErro mensagem={mesa.erro} status={mesa.status} />
      </>
    );
  }

  const comanda = mesa.dados.comandaAtiva ? await carregar(api.comandas.buscar(mesa.dados.comandaAtiva.id)) : null;

  return (
    <>
      <Cabecalho
        titulo={`Mesa ${mesa.dados.numero}`}
        descricao={<>{mesa.dados.capacidade} lugares</>}
        voltar={voltar}
      >
        <Selo tipo="mesa" status={situacaoDaMesa(mesa.dados)} />
        {comanda?.dados ? (
          <Link className="botao secundario" href={`/comandas/${comanda.dados.id}`}>
            Abrir comanda
          </Link>
        ) : null}
      </Cabecalho>
      {comanda === null ? (
        <EstadoVazio titulo="Mesa livre">Não há comanda aberta nesta mesa.</EstadoVazio>
      ) : comanda.erro !== undefined ? (
        <EstadoErro mensagem={comanda.erro} status={comanda.status} />
      ) : (
        <div className="grade-detalhe">
          <PedidosDaComanda comanda={comanda.dados} />
          <aside>
            <ResumoDaComanda comanda={comanda.dados} />
          </aside>
        </div>
      )}
    </>
  );
}
