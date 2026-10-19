import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { carregar, exigirUsuario } from '@/lib/sessao';
import { PERFIS_GERENCIA } from '@/lib/permissoes';
import { formatarHora, ROTULO_SITUACAO_MESA, situacaoDaMesa } from '@/lib/formato';
import { Cabecalho } from '@/components/Cabecalho';
import { EstadoErro, EstadoVazio } from '@/components/Estados';
import type { SituacaoMesa } from '@/lib/tipos';

export const metadata: Metadata = { title: 'Salão' };

const CLASSE: Record<SituacaoMesa, string> = {
  LIVRE: 'livre',
  OCUPADA: 'ocupada',
  AGUARDANDO_FECHAMENTO: 'aguardando',
};

export default async function PaginaSalao() {
  await exigirUsuario(PERFIS_GERENCIA);
  const mesas = await carregar(api.mesas.listar());

  if (mesas.erro !== undefined) {
    return (
      <>
        <Cabecalho titulo="Salão" />
        <EstadoErro mensagem={mesas.erro} status={mesas.status} />
      </>
    );
  }

  const comSituacao = mesas.dados.map((mesa) => ({ mesa, situacao: situacaoDaMesa(mesa) }));
  const total = (s: SituacaoMesa) => comSituacao.filter((m) => m.situacao === s).length;

  return (
    <>
      <Cabecalho titulo="Salão" descricao="Situação das mesas. Selecione uma mesa para ver a comanda." />
      {comSituacao.length === 0 ? (
        <EstadoVazio titulo="Nenhuma mesa cadastrada">Cadastre as mesas pela API para vê-las aqui.</EstadoVazio>
      ) : (
        <>
          <div className="legenda" aria-label="Legenda">
            {(['LIVRE', 'OCUPADA', 'AGUARDANDO_FECHAMENTO'] as SituacaoMesa[]).map((s) => (
              <span key={s}>
                <i className={`${CLASSE[s]}-i`} aria-hidden="true" />
                {ROTULO_SITUACAO_MESA[s]}: <strong className="numero">{total(s)}</strong>
              </span>
            ))}
          </div>
          <div className="mesas">
            {comSituacao.map(({ mesa, situacao }) => (
              <Link key={mesa.id} href={`/salao/${mesa.id}`} className={`mesa ${CLASSE[situacao]}`}>
                <span className="n">Mesa {mesa.numero}</span>
                <span>{ROTULO_SITUACAO_MESA[situacao]}</span>
                <small>
                  {mesa.comandaAtiva
                    ? `Comanda #${mesa.comandaAtiva.id} desde ${formatarHora(mesa.comandaAtiva.abertaEm)}`
                    : `${mesa.capacidade} lugares`}
                </small>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  );
}
