import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api } from '@/lib/api';
import { carregar, exigirUsuario } from '@/lib/sessao';
import { PERFIS_GERENCIA } from '@/lib/permissoes';
import { Cabecalho } from '@/components/Cabecalho';
import { EstadoErro } from '@/components/Estados';
import { FormProduto } from '../../FormProduto';

export const metadata: Metadata = { title: 'Editar produto' };

export default async function EditarProduto({ params }: { params: Promise<{ id: string }> }) {
  await exigirUsuario(PERFIS_GERENCIA);
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [produto, categorias] = await Promise.all([carregar(api.produtos.buscar(id)), carregar(api.categorias.listar())]);
  if (produto.erro !== undefined && produto.status === 404) notFound();
  const voltar = { href: '/cardapio', rotulo: 'Cardápio' };

  return (
    <>
      <Cabecalho titulo={produto.dados ? `Editar ${produto.dados.nome}` : 'Editar produto'} voltar={voltar} />
      {produto.erro !== undefined ? (
        <EstadoErro mensagem={produto.erro} status={produto.status} />
      ) : categorias.erro !== undefined ? (
        <EstadoErro mensagem={categorias.erro} status={categorias.status} />
      ) : (
        <div className="caixa" style={{ maxWidth: 620 }}>
          <FormProduto produto={produto.dados} categorias={categorias.dados} />
        </div>
      )}
    </>
  );
}
