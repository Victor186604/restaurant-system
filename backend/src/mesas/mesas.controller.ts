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
import { PerfilUsuario } from '../generated/prisma/enums.js';
import { MesasService } from './mesas.service.js';
import { CreateMesaDto } from './dto/create-mesa.dto.js';
import { UpdateMesaDto } from './dto/update-mesa.dto.js';
import { ListarMesasQuery } from './dto/listar-mesas.query.js';

@Controller('mesas')
@Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE, PerfilUsuario.GARCOM)
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
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
  criar(@Body() dto: CreateMesaDto) {
    return this.mesas.criar(dto);
  }

  @Patch(':id')
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
  atualizar(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMesaDto) {
    return this.mesas.atualizar(id, dto);
  }
}
