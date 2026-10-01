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
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { QueryUsuariosDto } from './dto/query-usuarios.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  findAll(@Query() query: QueryUsuariosDto) {
    return this.usuariosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }
}
