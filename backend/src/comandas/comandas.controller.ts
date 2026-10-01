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
import { ComandasService } from './comandas.service.js';
import { CreateComandaDto } from './dto/create-comanda.dto.js';
import { ListarComandasQuery } from './dto/listar-comandas.query.js';

@Controller('comandas')
export class ComandasController {
  constructor(private readonly comandas: ComandasService) {}

  @Post()
  abrir(@Body() dto: CreateComandaDto) {
    return this.comandas.abrir(dto);
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
  @HttpCode(HttpStatus.OK)
  fechar(@Param('id', ParseIntPipe) id: number) {
    return this.comandas.fechar(id);
  }

  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  cancelar(@Param('id', ParseIntPipe) id: number) {
    return this.comandas.cancelar(id);
  }
}
