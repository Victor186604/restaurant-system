import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './decorators/public.decorator.js';
import { UsuarioAtual } from './decorators/usuario-atual.decorator.js';
import type { UsuarioAutenticado } from './auth.types.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto, @Ip() ip: string) {
    return this.auth.login(dto, ip);
  }

  /** Dados do usuário dono do token (perfil usado pelos clientes para montar a interface). */
  @Get('me')
  me(@UsuarioAtual() usuario: UsuarioAutenticado): UsuarioAutenticado {
    return usuario;
  }
}
