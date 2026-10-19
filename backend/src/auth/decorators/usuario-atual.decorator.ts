import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestComUsuario, UsuarioAutenticado } from '../auth.types.js';

/** Injeta o usuário autenticado (preenchido pelo JwtAuthGuard). */
export const UsuarioAtual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const request = ctx.switchToHttp().getRequest<RequestComUsuario>();
    return request.usuario!;
  },
);
