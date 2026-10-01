import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProdutoDto } from './dto/create-produto.dto.js';
import { QueryProdutosDto } from './dto/query-produtos.dto.js';
import { UpdateProdutoDto } from './dto/update-produto.dto.js';

const comCategoria = {
  categoria: { select: { id: true, nome: true } },
} as const;

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(query: QueryProdutosDto) {
    return this.prisma.produto.findMany({
      where: { categoriaId: query.categoriaId, disponivel: query.disponivel },
      include: comCategoria,
      orderBy: [{ categoria: { nome: 'asc' } }, { nome: 'asc' }],
    });
  }

  async findOne(id: number) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: comCategoria,
    });
    if (!produto) {
      throw new NotFoundException(`Produto ${id} não encontrado`);
    }
    return produto;
  }

  async create(dto: CreateProdutoDto) {
    await this.garantirCategoria(dto.categoriaId);
    return this.prisma.produto.create({ data: dto, include: comCategoria });
  }

  async update(id: number, dto: UpdateProdutoDto) {
    await this.findOne(id);
    if (dto.categoriaId !== undefined) {
      await this.garantirCategoria(dto.categoriaId);
    }
    return this.prisma.produto.update({
      where: { id },
      data: dto,
      include: comCategoria,
    });
  }

  private async garantirCategoria(categoriaId: number) {
    const existe = await this.prisma.categoria.count({
      where: { id: categoriaId },
    });
    if (!existe) {
      throw new NotFoundException(`Categoria ${categoriaId} não encontrada`);
    }
  }
}
