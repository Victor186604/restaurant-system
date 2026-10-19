import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  gerarHashSenha,
  verificarSenha,
} from '../common/utils/password.util.js';
import { LimitadorLogin } from './limitador-login.js';
import type { JwtPayload, UsuarioAutenticado } from './auth.types.js';
import { LoginDto } from './dto/login.dto.js';

const CREDENCIAIS_INVALIDAS = 'E-mail ou senha inválidos.';

@Injectable()
export class AuthService {
  private readonly limitador = new LimitadorLogin();
  /** Hash fictício: usado quando o e-mail não existe, para o tempo de resposta não revelar isso. */
  private readonly hashFicticio = gerarHashSenha('senha-ficticia-nao-usada');

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(dto: LoginDto, ip: string) {
    const chave = `${dto.email}|${ip}`;
    this.limitador.verificar(chave);

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    const senhaOk = await verificarSenha(
      dto.senha,
      usuario?.senhaHash ?? (await this.hashFicticio),
    );

    if (!usuario || !senhaOk || !usuario.ativo) {
      this.limitador.registrarFalha(chave);
      throw new UnauthorizedException(CREDENCIAIS_INVALIDAS);
    }
    this.limitador.limpar(chave);

    const payload: JwtPayload = { sub: usuario.id };
    const usuarioAutenticado: UsuarioAutenticado = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
    };
    return {
      accessToken: await this.jwt.signAsync(payload),
      tokenType: 'Bearer' as const,
      expiresIn: this.config.getOrThrow<number>('JWT_EXPIRES_IN'),
      usuario: usuarioAutenticado,
    };
  }
}
