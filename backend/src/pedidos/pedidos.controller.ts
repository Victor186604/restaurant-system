import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Perfis } from '../auth/decorators/perfis.decorator.js';
import { UsuarioAtual } from '../auth/decorators/usuario-atual.decorator.js';
import type { UsuarioAutenticado } from '../auth/auth.types.js';
import { PerfilUsuario } from '../generated/prisma/enums.js';
import { PedidosService } from './pedidos.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto.js';
import { ListarPedidosQuery } from './dto/listar-pedidos.query.js';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE, PerfilUsuario.GARCOM)
  criar(
    @Body() dto: CreatePedidoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    return this.pedidos.criar(dto, usuario.id);
  }

  @Get()
  listar(@Query() query: ListarPedidosQuery) {
    return this.pedidos.listar(query);
  }

  /** Declarada antes de ':id' para não ser capturada como id. */
  @Get('cozinha')
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE, PerfilUsuario.COZINHA)
  cozinha() {
    return this.pedidos.cozinha();
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.pedidos.buscar(id);
  }

  @Patch(':id/status')
  alterarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusPedidoDto,
    @UsuarioAtual() usuario: UsuarioAutenticado,
  ) {
    // A permissão depende do status de destino: verificada no service.
    return this.pedidos.alterarStatus(id, dto, usuario);
  }
}
