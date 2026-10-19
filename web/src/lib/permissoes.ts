import type { Perfil } from './tipos';

/**
 * Espelho, para a INTERFACE, da matriz de permissões do contrato
 * (docs/contrato-api.md). Serve só para esconder o que o perfil não usa;
 * quem decide de fato é sempre a API (401/403).
 */
export const PERFIS_COZINHA: Perfil[] = ['COZINHA', 'GERENTE', 'ADMIN'];
export const PERFIS_GERENCIA: Perfil[] = ['GERENTE', 'ADMIN'];

export const NAVEGACAO: { href: string; rotulo: string; perfis: Perfil[] }[] = [
  { href: '/cozinha', rotulo: 'Cozinha', perfis: PERFIS_COZINHA },
  { href: '/salao', rotulo: 'Salão', perfis: PERFIS_GERENCIA },
  { href: '/comandas', rotulo: 'Comandas', perfis: PERFIS_GERENCIA },
  { href: '/cardapio', rotulo: 'Cardápio', perfis: PERFIS_GERENCIA },
];

export function paginaInicial(perfil: Perfil): string {
  if (perfil === 'COZINHA') return '/cozinha';
  if (perfil === 'GARCOM') return '/sem-acesso';
  return '/salao';
}

export function podeFecharComanda(perfil: Perfil): boolean {
  return PERFIS_GERENCIA.includes(perfil);
}

export const ROTULO_PERFIL: Record<Perfil, string> = {
  ADMIN: 'Administrador',
  GERENTE: 'Gerência',
  GARCOM: 'Garçom',
  COZINHA: 'Cozinha',
};
