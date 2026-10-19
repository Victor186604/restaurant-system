import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { Perfis } from '../auth/decorators/perfis.decorator.js';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { PerfilUsuario } from '../generated/prisma/enums.js';
import { ComandasService } from './comandas.service.js';
import { CreateComandaDto } from './dto/create-comanda.dto.js';
import { ListarComandasQuery } from './dto/listar-comandas.query.js';

@Controller('comandas')
@Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE, PerfilUsuario.GARCOM)
export class ComandasController {
  constructor(private readonly comandas: ComandasService) {}

  @Post()
  abrir(
    @Body() dto: CreateComandaDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.comandas.abrir(dto, usuario.id);
  }

  @Get()
  listar(@Query() query: ListarComandasQuery) {
    return this.comandas.listar(query);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.comandas.buscar(id);
  }

  @Post(':id/solicitar-fechamento')
  @HttpCode(HttpStatus.OK)
  solicitarFechamento(@Param('id', ParseIntPipe) id: number) {
    return this.comandas.solicitarFechamento(id);
  }

  @Post(':id/fechar')
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
  @HttpCode(HttpStatus.OK)
  fechar(@Param('id', ParseIntPipe) id: number) {
    return this.comandas.fechar(id);
  }

  @Post(':id/cancelar')
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
  @HttpCode(HttpStatus.OK)
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.comandas.cancelar(id);
  }
}
