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
import { CreateMesaDto } from './dto/create-mesa.dto.js';
import { QueryMesasDto } from './dto/query-mesas.dto.js';
import { UpdateMesaDto } from './dto/update-mesa.dto.js';
import { MesasService } from './mesas.service.js';

@Controller('mesas')
export class MesasController {
  constructor(private readonly mesasService: MesasService) {}

  @Get()
  findAll(@Query() query: QueryMesasDto) {
    return this.mesasService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.mesasService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMesaDto) {
    return this.mesasService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMesaDto) {
    return this.mesasService.update(id, dto);
  }
}
