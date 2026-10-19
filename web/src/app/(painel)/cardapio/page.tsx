import type { Metadata } from 'next';
import Link from 'next/link';
import { api } from '@/lib/api';
import { carregar, exigirUsuario } from '@/lib/sessao';
import { PERFIS_GERENCIA } from '@/lib/permissoes';
import { formatarMoeda } from '@/lib/formato';
import { Cabecalho } from '@/components/Cabecalho';
import { Aviso, EstadoErro, EstadoVazio } from '@/components/Estados';
import { FormCategoria } from './FormCategoria';

export const metadata: Metadata = { title: 'Cardápio' };

const MENSAGENS: Record<string, string> = {
  criado: 'Produto cadastrado.',
  atualizado: 'Produto atualizado.',
};

export default async function PaginaCardapio({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await exigirUsuario(PERFIS_GERENCIA);
  const { ok } = await searchParams;
  const [categorias, produtos] = await Promise.all([
    carregar(api.categorias.listar()),
    carregar(api.produtos.listar()),
  ]);

  return (
    <>
      <Cabecalho titulo="Cardápio" descricao="Produtos por categoria. Preços valem para os próximos pedidos.">
        <Link className="botao" href="/cardapio/novo">
          Novo produto
        </Link>
      </Cabecalho>
      {ok && MENSAGENS[ok] ? <Aviso tipo="sucesso">{MENSAGENS[ok]}</Aviso> : null}

      {categorias.erro !== undefined ? (
        <EstadoErro mensagem={categorias.erro} status={categorias.status} />
      ) : produtos.erro !== undefined ? (
        <EstadoErro mensagem={produtos.erro} status={produtos.status} />
      ) : (
        <div className="dupla">
          <div>
            {categorias.dados.length === 0 ? (
              <EstadoVazio titulo="Nenhuma categoria cadastrada">Crie a primeira categoria ao lado.</EstadoVazio>
            ) : (
              categorias.dados.map((categoria) => {
                const itens = produtos.dados.filter((p) => p.categoriaId === categoria.id);
                return (
                  <section key={categoria.id} className="categoria-bloco">
                    <h2>
                      {categoria.nome}
                      {!categoria.ativa ? <span className="selo neutro">Inativa</span> : null}
                    </h2>
                    {itens.length === 0 ? (
                      <EstadoVazio titulo="Nenhum produto nesta categoria">
                        <Link className="botao secundario pequeno" href="/cardapio/novo">
                          Cadastrar produto
                        </Link>
                      </EstadoVazio>
                    ) : (
                      <div className="tabela-rolagem">
                        <table>
                          <thead>
                            <tr>
                              <th>Produto</th>
                              <th>Situação</th>
                              <th className="valor">Preço</th>
                              <th>
                                <span className="sr-only">Ações</span>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {itens.map((p) => (
                              <tr key={p.id} className={p.ativo ? undefined : 'linha-inativa'}>
                                <td>
                                  <strong>{p.nome}</strong>
                                  {p.descricao ? <div className="texto-2">{p.descricao}</div> : null}
                                </td>
                                <td>
                                  {!p.ativo ? (
                                    <span className="selo neutro">Removido</span>
                                  ) : p.disponivel ? (
                                    <span className="selo manjericao">Disponível</span>
                                  ) : (
                                    <span className="selo acafrao">Indisponível</span>
                                  )}
                                </td>
                                <td className="valor">{formatarMoeda(p.preco)}</td>
                                <td className="valor">
                                  <Link
                                    className="botao secundario pequeno"
                                    href={`/cardapio/${p.id}/editar`}
                                    aria-label={`Editar ${p.nome}`}
                                  >
                                    Editar
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                );
              })
            )}
          </div>
          <aside className="caixa">
            <FormCategoria />
          </aside>
        </div>
      )}
    </>
  );
}
