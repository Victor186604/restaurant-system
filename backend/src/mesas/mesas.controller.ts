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
import { MesasService } from './mesas.service.js';
import { CreateMesaDto } from './dto/create-mesa.dto.js';
import { UpdateMesaDto } from './dto/update-mesa.dto.js';
import { ListarMesasQuery } from './dto/listar-mesas.query.js';

@Controller('mesas')
export class MesasController {
  constructor(private readonly mesas: MesasService) {}

  @Get()
  listar(@Query() query: ListarMesasQuery) {
    return this.mesas.listar(query);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.mesas.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateMesaDto) {
    return this.mesas.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMesaDto) {
    return this.mesas.atualizar(id, dto);
  }
}
