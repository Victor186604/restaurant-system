import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoriaDto } from './dto/create-categoria.dto.js';
import { UpdateCategoriaDto } from './dto/update-categoria.dto.js';
import { ListarCategoriasQuery } from './dto/listar-categorias.query.js';

@Injectable()
export class CategoriasService {
  constructor(private readonly prisma: PrismaService) {}

  listar(query: ListarCategoriasQuery) {
    return this.prisma.categoria.findMany({
      where: { ativa: query.incluirInativas ? undefined : true },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
  }

  async buscar(id: number) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) {
      throw new NotFoundException(`Categoria ${id} não encontrada.`);
    }
    return categoria;
  }

  async criar(dto: CreateCategoriaDto) {
    await this.garantirNomeLivre(dto.nome);
    return this.prisma.categoria.create({ data: dto });
  }

  async atualizar(id: number, dto: UpdateCategoriaDto) {
    const atual = await this.buscar(id);
    if (dto.nome !== undefined && dto.nome !== atual.nome) {
      await this.garantirNomeLivre(dto.nome);
    }
    return this.prisma.categoria.update({ where: { id }, data: dto });
  }

  private async garantirNomeLivre(nome: string) {
    const existe = await this.prisma.categoria.count({
      where: { nome: { equals: nome, mode: 'insensitive' } },
    });
    if (existe) {
      throw new ConflictException(`Já existe uma categoria chamada "${nome}".`);
    }
  }
}
