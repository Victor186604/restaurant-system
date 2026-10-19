import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { usuarioAtual } from '@/lib/sessao';
import { NAVEGACAO, ROTULO_PERFIL } from '@/lib/permissoes';
import { MenuLateral } from '@/components/MenuLateral';
import { EstadoErro } from '@/components/Estados';
import { sair } from '../acoes-sessao';
import type { Usuario } from '@/lib/tipos';

export default async function LayoutPainel({ children }: { children: React.ReactNode }) {
  let usuario: Usuario;
  try {
    usuario = await usuarioAtual();
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 401) redirect('/sair');
    const mensagem = erro instanceof ApiError ? erro.message : 'Erro inesperado.';
    return (
      <main className="conteudo">
        <EstadoErro mensagem={mensagem} status={erro instanceof ApiError ? erro.status : undefined} />
      </main>
    );
  }

  const itens = NAVEGACAO.filter((item) => item.perfis.includes(usuario.perfil));
  return (
    <div className="painel">
      <aside className="lateral">
        <div className="marca">
          Restaurante
          <span>Cozinha e gerência</span>
        </div>
        <MenuLateral itens={itens.map(({ href, rotulo }) => ({ href, rotulo }))} />
        <div className="usuario">
          <div>
            <strong>{usuario.nome}</strong>
            <small>{ROTULO_PERFIL[usuario.perfil]}</small>
          </div>
          <form action={sair}>
            <button type="submit" className="botao claro pequeno">
              Sair
            </button>
          </form>
        </div>
      </aside>
      <main className="conteudo">{children}</main>
    </div>
  );
}
