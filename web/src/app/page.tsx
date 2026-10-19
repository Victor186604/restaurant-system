import { redirect } from 'next/navigation';
import { exigirUsuario } from '@/lib/sessao';
import { paginaInicial } from '@/lib/permissoes';

/** Raiz: leva cada perfil para a sua tela principal. */
export default async function Inicio() {
  const usuario = await exigirUsuario();
  redirect(paginaInicial(usuario.perfil));
}
