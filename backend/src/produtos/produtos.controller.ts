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
import { CreateProdutoDto } from './dto/create-produto.dto.js';
import { QueryProdutosDto } from './dto/query-produtos.dto.js';
import { UpdateProdutoDto } from './dto/update-produto.dto.js';
import { ProdutosService } from './produtos.service.js';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Get()
  findAll(@Query() query: QueryProdutosDto) {
    return this.produtosService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.produtosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProdutoDto) {
    return this.produtosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProdutoDto) {
    return this.produtosService.update(id, dto);
  }
}
