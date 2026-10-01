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
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { QueryPedidosDto } from './dto/query-pedidos.dto.js';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto.js';
import { PedidosService } from './pedidos.service.js';

@Controller('pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  @Get()
  findAll(@Query() query: QueryPedidosDto) {
    return this.pedidosService.findAll(query);
  }

  @Get('cozinha')
  filaCozinha() {
    return this.pedidosService.filaCozinha();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.pedidosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePedidoDto) {
    return this.pedidosService.create(dto);
  }

  @Patch(':id/status')
  atualizarStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusPedidoDto,
  ) {
    return this.pedidosService.atualizarStatus(id, dto.status);
  }
}
