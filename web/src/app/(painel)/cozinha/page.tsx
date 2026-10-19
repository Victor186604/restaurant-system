import type { Metadata } from 'next';
import { api } from '@/lib/api';
import { carregar, exigirUsuario } from '@/lib/sessao';
import { PERFIS_COZINHA } from '@/lib/permissoes';
import { Cabecalho } from '@/components/Cabecalho';
import { EstadoErro } from '@/components/Estados';
import { QuadroCozinha } from './QuadroCozinha';

export const metadata: Metadata = { title: 'Cozinha' };

export default async function PaginaCozinha() {
  await exigirUsuario(PERFIS_COZINHA);
  // Fila (PENDENTE + EM_PREPARO) e prontos aguardando o garçom.
  const [fila, prontos] = await Promise.all([
    carregar(api.pedidos.cozinha()),
    carregar(api.pedidos.listar(['PRONTO'])),
  ]);

  return (
    <>
      <Cabecalho titulo="Cozinha" descricao="Pedidos do mais antigo para o mais novo." />
      {fila.erro !== undefined ? (
        <EstadoErro mensagem={fila.erro} status={fila.status} />
      ) : prontos.erro !== undefined ? (
        <EstadoErro mensagem={prontos.erro} status={prontos.status} />
      ) : (
        <QuadroCozinha
          pendentes={fila.dados.filter((p) => p.status === 'PENDENTE')}
          emPreparo={fila.dados.filter((p) => p.status === 'EM_PREPARO')}
          prontos={prontos.dados}
          agora={Date.now()}
        />
      )}
    </>
  );
}
