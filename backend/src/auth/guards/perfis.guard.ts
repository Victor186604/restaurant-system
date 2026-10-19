import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { PerfilUsuario } from '../../generated/prisma/enums.js';
import { PERFIS_KEY } from '../decorators/perfis.decorator.js';
import type { RequestComUsuario } from '../auth.types.js';

/** Guard global: aplica o @Perfis(...) da rota. Executa depois do JwtAuthGuard. */
@Injectable()
export class PerfisGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const permitidos = this.reflector.getAllAndOverride<PerfilUsuario[]>(
      PERFIS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!permitidos || permitidos.length === 0) return true;

    const { usuario } = context.switchToHttp().getRequest<RequestComUsuario>();
    if (!usuario) return true; // rota pública: o JwtAuthGuard já decidiu

    if (!permitidos.includes(usuario.perfil)) {
      throw new ForbiddenException(
        `O perfil ${usuario.perfil} não tem permissão para esta operação.`,
      );
    }
    return true;
  }
}
