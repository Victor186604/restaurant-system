import { SetMetadata } from '@nestjs/common';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';

export const PERFIS_KEY = 'perfis';

/**
 * Perfis autorizados na rota (no método ou no controller inteiro).
 * Sem @Perfis, qualquer usuário autenticado acessa.
 */
export const Perfis = (...perfis: PerfilUsuario[]) =>
  SetMetadata(PERFIS_KEY, perfis);
