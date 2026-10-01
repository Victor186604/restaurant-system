import { Injectable, NotFoundException } from '@nestjs/common';
import { StatusComanda } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateMesaDto } from './dto/create-mesa.dto.js';
import { QueryMesasDto } from './dto/query-mesas.dto.js';
import { UpdateMesaDto } from './dto/update-mesa.dto.js';

/** Inclui a comanda em andamento (não fechada) da mesa, se houver. */
const comandaAtiva = {
  comandas: {
    where: { status: { not: StatusComanda.FECHADA } },
    select: { id: true, status: true, nomeCliente: true, abertaEm: true },
    take: 1,
  },
} as const;

type MesaComComandas = {
  comandas: { id: number }[];
} & Record<string, unknown>;

function comComandaAtiva<T extends MesaComComandas>({ comandas, ...mesa }: T) {
  return { ...mesa, comandaAtiva: comandas[0] ?? null };
}

@Injectable()
export class MesasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMesasDto) {
    const mesas = await this.prisma.mesa.findMany({
      where: { status: query.status },
      include: comandaAtiva,
      orderBy: { numero: 'asc' },
    });
    return mesas.map(comComandaAtiva);
  }

  async findOne(id: number) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id },
      include: comandaAtiva,
    });
    if (!mesa) {
      throw new NotFoundException(`Mesa ${id} não encontrada`);
    }
    return comComandaAtiva(mesa);
  }

  create(dto: CreateMesaDto) {
    return this.prisma.mesa.create({ data: dto });
  }

  async update(id: number, dto: UpdateMesaDto) {
    await this.findOne(id);
    return this.prisma.mesa.update({ where: { id }, data: dto });
  }
}
