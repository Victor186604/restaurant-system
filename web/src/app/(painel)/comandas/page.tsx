import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { carregar, exigirUsuario } from '@/lib/sessao';
import { PERFIS_GERENCIA } from '@/lib/permissoes';
import { formatarDataHora, formatarMoeda } from '@/lib/formato';
import { Cabecalho } from '@/components/Cabecalho';
import { EstadoErro, EstadoVazio } from '@/components/Estados';
import { Selo } from '@/components/Selo';
import type { StatusComanda } from '@/lib/tipos';

export const metadata: Metadata = { title: 'Comandas' };

const FILTROS: { chave: string; rotulo: string; status?: StatusComanda[] }[] = [
  { chave: 'ativas', rotulo: 'Em andamento', status: ['ABERTA', 'FECHAMENTO_SOLICITADO'] },
  { chave: 'ABERTA', rotulo: 'Abertas', status: ['ABERTA'] },
  { chave: 'FECHAMENTO_SOLICITADO', rotulo: 'Aguardando fechamento', status: ['FECHAMENTO_SOLICITADO'] },
  { chave: 'FECHADA', rotulo: 'Fechadas', status: ['FECHADA'] },
  { chave: 'CANCELADA', rotulo: 'Canceladas', status: ['CANCELADA'] },
  { chave: 'todas', rotulo: 'Todas' },
];

export default async function PaginaComandas({ searchParams }: { searchParams: Promise<{ situacao?: string }> }) {
  await exigirUsuario(PERFIS_GERENCIA);
  const { situacao } = await searchParams;
  const filtro = FILTROS.find((f) => f.chave === situacao) ?? FILTROS[0];
  const comandas = await carregar(api.comandas.listar(filtro.status));

  return (
    <>
      <Cabecalho titulo="Comandas" descricao="Filtre pela situação e abra uma comanda para ver itens e total." />
      <nav className="filtros" aria-label="Filtrar por situação">
        {FILTROS.map((f) => (
          <Link key={f.chave} href={`/comandas?situacao=${f.chave}`} aria-current={f.chave === filtro.chave}>
            {f.rotulo}
          </Link>
        ))}
      </nav>
      {comandas.erro !== undefined ? (
        <EstadoErro mensagem={comandas.erro} status={comandas.status} />
      ) : comandas.dados.length === 0 ? (
        <EstadoVazio titulo={`Nenhuma comanda em “${filtro.rotulo.toLowerCase()}”`}>
          Escolha outra situação acima.
        </EstadoVazio>
      ) : (
        <div className="tabela-rolagem">
          <table>
            <thead>
              <tr>
                <th>Comanda</th>
                <th>Mesa</th>
                <th>Cliente</th>
                <th>Garçom</th>
                <th>Situação</th>
                <th className="valor">Pedidos</th>
                <th>Aberta em</th>
                <th className="valor">Total</th>
              </tr>
            </thead>
            <tbody>
              {comandas.dados.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link href={`/comandas/${c.id}`}>#{c.id}</Link>
                  </td>
                  <td className="numero">{c.mesa.numero}</td>
                  <td>{c.nomeCliente ?? '—'}</td>
                  <td>{c.garcom?.nome ?? '—'}</td>
                  <td>
                    <Selo tipo="comanda" status={c.status} />
                  </td>
                  <td className="valor">{c._count.pedidos}</td>
                  <td>{formatarDataHora(c.abertaEm)}</td>
                  <td className="valor">
                    {c.total != null ? formatarMoeda(c.total) : <Link href={`/comandas/${c.id}`}>ver parcial</Link>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
