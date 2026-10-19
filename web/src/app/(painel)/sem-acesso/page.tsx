import { exigirUsuario } from '@/lib/sessao';
import { ROTULO_PERFIL } from '@/lib/permissoes';
import { EstadoVazio } from '@/components/Estados';

export default async function SemAcesso() {
  const usuario = await exigirUsuario();
  return (
    <EstadoVazio titulo="Este painel é da cozinha e da gerência">
      <p>
        Você entrou como {ROTULO_PERFIL[usuario.perfil]}. Use o aplicativo do garçom para abrir comandas e lançar
        pedidos.
      </p>
    </EstadoVazio>
  );
}
