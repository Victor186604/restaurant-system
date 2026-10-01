import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.categoria.findMany({
      include: { _count: { select: { produtos: true } } },
      orderBy: { nome: 'asc' },
    });
  }

  async findOne(id: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id },
      include: { produtos: { orderBy: { nome: 'asc' } } },
    });
    if (!categoria) {
      throw new NotFoundException(`Categoria ${id} não encontrada`);
    }
    return categoria;
  }

  create(dto: CreateCategoriaDto) {
    return this.prisma.categoria.create({ data: dto });
  }

  async update(id: number, dto: UpdateCategoriaDto) {
    await this.findOne(id);
    return this.prisma.categoria.update({ where: { id }, data: dto });
  }
}
