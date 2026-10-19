import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { JwtPayload, RequestComUsuario } from '../auth.types.js';

/**
 * Guard global: toda rota exige "Authorization: Bearer <token>", exceto as
 * marcadas com @Public(). O usuário é recarregado do banco a cada requisição,
 * então desativar um usuário ou trocar seu perfil tem efeito imediato.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publica) return true;

    const request = context.switchToHttp().getRequest<RequestComUsuario>();
    const [tipo, token] = (request.headers.authorization ?? '').split(' ');
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: Number(payload.sub) },
      select: { id: true, nome: true, email: true, perfil: true, ativo: true },
    });
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException('Usuário inexistente ou desativado.');
    }

    request.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
    return true;
  }
}
