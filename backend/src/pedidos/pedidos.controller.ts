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
import { PedidosService } from './pedidos.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto.js';
import { ListarPedidosQuery } from './dto/listar-pedidos.query.js';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  @Post()
  criar(@Body() dto: CreatePedidoDto) {
    return this.pedidos.criar(dto);
  }

  @Get()
  listar(@Query() query: ListarPedidosQuery) {
    return this.pedidos.listar(query);
  }

  /** Declarada antes de ':id' para não ser capturada como id. */
  @Get('cozinha')
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
  ) {
    return this.pedidos.alterarStatus(id, dto);
  }
}
