import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { CreateProdutoDto } from './dto/create-produto.dto.js';
import { UpdateProdutoDto } from './dto/update-produto.dto.js';
import { ListarProdutosQuery } from './dto/listar-produtos.query.js';

const produtoInclude = {
  categoria: { select: { id: true, nome: true } },
} satisfies Prisma.ProdutoInclude;

@Injectable()
export class ProdutosService {
  constructor(private readonly prisma: PrismaService) {}

  listar(query: ListarProdutosQuery) {
    return this.prisma.produto.findMany({
      where: {
        categoriaId: query.categoriaId,
        disponivel: query.disponivel,
        ...(query.incluirInativos
          ? {}
          : { ativo: true, categoria: { ativa: true } }),
      },
      include: produtoInclude,
      orderBy: [{ categoria: { ordem: 'asc' } }, { nome: 'asc' }],
    });
  }

  async buscar(id: number) {
    const produto = await this.prisma.produto.findUnique({
      where: { id },
      include: produtoInclude,
    });
    if (!produto) throw new NotFoundException(`Produto ${id} não encontrado.`);
    return produto;
  }

  async criar(dto: CreateProdutoDto) {
    await this.validarCategoria(dto.categoriaId);
    await this.garantirNomeLivre(dto.categoriaId, dto.nome);
    return this.prisma.produto.create({
      data: { ...dto, preco: new Prisma.Decimal(dto.preco) },
      include: produtoInclude,
    });
  }

  async atualizar(id: number, dto: UpdateProdutoDto) {
    const atual = await this.buscar(id);
    const categoriaId = dto.categoriaId ?? atual.categoriaId;
    if (
      dto.categoriaId !== undefined &&
      dto.categoriaId !== atual.categoriaId
    ) {
      await this.validarCategoria(dto.categoriaId);
    }
    const nome = dto.nome ?? atual.nome;
    if (nome !== atual.nome || categoriaId !== atual.categoriaId) {
      await this.garantirNomeLivre(categoriaId, nome, id);
    }
    const { preco, ...dados } = dto;
    return this.prisma.produto.update({
      where: { id },
      data: {
        ...dados,
        ...(preco !== undefined ? { preco: new Prisma.Decimal(preco) } : {}),
      },
      include: produtoInclude,
    });
  }

  private async validarCategoria(categoriaId: number) {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: categoriaId },
    });
    if (!categoria) {
      throw new NotFoundException(`Categoria ${categoriaId} não encontrada.`);
    }
    if (!categoria.ativa) {
      throw new UnprocessableEntityException(
        `A categoria "${categoria.nome}" está inativa.`,
      );
    }
  }

  private async garantirNomeLivre(
    categoriaId: number,
    nome: string,
    ignorarId?: number,
  ) {
    const existe = await this.prisma.produto.count({
      where: {
        categoriaId,
        nome: { equals: nome, mode: 'insensitive' },
        id: ignorarId ? { not: ignorarId } : undefined,
      },
    });
    if (existe) {
      throw new ConflictException(
        `Já existe um produto "${nome}" nesta categoria.`,
      );
    }
  }
}
