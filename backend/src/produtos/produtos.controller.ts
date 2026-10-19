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
import { ProdutosService } from './produtos.service.js';
import { CreateProdutoDto } from './dto/create-produto.dto.js';
import { UpdateProdutoDto } from './dto/update-produto.dto.js';
import { ListarProdutosQuery } from './dto/listar-produtos.query.js';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtos: ProdutosService) {}

  @Get()
  listar(@Query() query: ListarProdutosQuery) {
    return this.produtos.listar(query);
  }

  @Get(':id')
  buscar(@Param('id', ParseIntPipe) id: number) {
    return this.produtos.buscar(id);
  }

  @Post()
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
  criar(@Body() dto: CreateProdutoDto) {
    return this.produtos.criar(dto);
  }

  @Patch(':id')
  @Perfis(PerfilUsuario.ADMIN, PerfilUsuario.GERENTE)
  atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProdutoDto,
  ) {
    return this.produtos.atualizar(id, dto);
  }
}
