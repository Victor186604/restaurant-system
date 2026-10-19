import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { carregar, exigirUsuario } from '@/lib/sessao';
import { PERFIS_GERENCIA } from '@/lib/permissoes';
import { Cabecalho } from '@/components/Cabecalho';
import { EstadoErro, EstadoVazio } from '@/components/Estados';
import { FormProduto } from '../FormProduto';

export const metadata: Metadata = { title: 'Novo produto' };

export default async function NovoProduto() {
  await exigirUsuario(PERFIS_GERENCIA);
  const categorias = await carregar(api.categorias.listar());
  return (
    <>
      <Cabecalho titulo="Novo produto" voltar={{ href: '/cardapio', rotulo: 'Cardápio' }} />
      {categorias.erro !== undefined ? (
        <EstadoErro mensagem={categorias.erro} status={categorias.status} />
      ) : categorias.dados.some((c) => c.ativa) ? (
        <div className="caixa" style={{ maxWidth: 620 }}>
          <FormProduto categorias={categorias.dados} />
        </div>
      ) : (
        <EstadoVazio titulo="Crie uma categoria primeiro">Os produtos precisam de uma categoria ativa.</EstadoVazio>
      )}
    </>
  );
}
