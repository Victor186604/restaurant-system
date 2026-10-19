import type { Request } from 'express';
import type { PerfilUsuario } from '../generated/prisma/enums.js';

/** Usuário autenticado, recarregado do banco a cada requisição. */
export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
}

/** Conteúdo assinado no JWT (somente o id; o resto vem do banco). */
export interface JwtPayload {
  sub: number;
}

export type RequestComUsuario = Request & { usuario?: UsuarioAutenticado };
