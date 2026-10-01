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
import { AbrirComandaDto } from './dto/abrir-comanda.dto.js';
import { QueryComandasDto } from './dto/query-comandas.dto.js';

@Controller('comandas')
export class ComandasController {
  constructor(private readonly comandasService: ComandasService) {}

  @Get()
  findAll(@Query() query: QueryComandasDto) {
    return this.comandasService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.comandasService.findOne(id);
  }

  @Post()
  abrir(@Body() dto: AbrirComandaDto) {
    return this.comandasService.abrir(dto);
  }

  @Post(':id/solicitar-fechamento')
  @HttpCode(HttpStatus.OK)
  solicitarFechamento(@Param('id', ParseIntPipe) id: number) {
    return this.comandasService.solicitarFechamento(id);
  }

  @Post(':id/fechar')
  @HttpCode(HttpStatus.OK)
  fechar(@Param('id', ParseIntPipe) id: number) {
    return this.comandasService.fechar(id);
  }
}
