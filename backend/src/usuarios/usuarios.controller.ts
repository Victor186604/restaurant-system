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
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { ListarUsuariosQuery } from './dto/listar-usuarios.query.js';

@Controller('usuarios')
@Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  listar(@Query() query: ListarUsuariosQuery) {
    return this.usuarios.listar(query);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.usuarios.buscar(id);
  }

  @Post()
  @Perfis(PerfilUsuario.ADMIN)
  criar(@Body() dto: CreateUsuarioDto) {
    return this.usuarios.criar(dto);
  }

  @Patch(':id')
  @Perfis(PerfilUsuario.ADMIN)
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUsuarioDto,
  ) {
    return this.usuarios.atualizar(id, dto);
  }
}
