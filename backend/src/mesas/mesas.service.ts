import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  Prisma,
  StatusComanda,
  StatusMesa,
} from '../generated/prisma/client.js';
import { CreateMesaDto } from './dto/create-mesa.dto.js';
import { UpdateMesaDto } from './dto/update-mesa.dto.js';
import { ListarMesasQuery } from './dto/listar-mesas.query.js';

export const STATUS_COMANDA_ATIVA: StatusComanda[] = [
  StatusComanda.ABERTA,
  StatusComanda.FECHAMENTO_SOLICITADO,
];

/** Cada mesa vem com sua comanda ativa (se houver) — útil para o painel do salão. */
const mesaInclude = {
  comandas: {
    where: { status: { in: STATUS_COMANDA_ATIVA } },
    select: { id: true, status: true, abertaEm: true, nomeCliente: true },
    take: 1,
  },
} satisfies Prisma.MesaInclude;

type MesaComComandas = Prisma.MesaGetPayload<{ include: typeof mesaInclude }>;

function formatarMesa({ comandas, ...mesa }: MesaComComandas) {
  return { ...mesa, comandaAtiva: comandas[0] ?? null };
}

@Injectable()
export class MesasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(query: ListarMesasQuery) {
    const mesas = await this.prisma.mesa.findMany({
      where: {
        status: query.status,
        ativa: query.incluirInativas ? undefined : true,
      },
      include: mesaInclude,
      orderBy: { numero: 'asc' },
    });
    return mesas.map(formatarMesa);
  }

  async buscar(id: number) {
    const mesa = await this.prisma.mesa.findUnique({
      where: { id },
      include: mesaInclude,
    });
    if (!mesa) throw new NotFoundException(`Mesa ${id} não encontrada.`);
    return formatarMesa(mesa);
  }

  async criar(dto: CreateMesaDto) {
    await this.garantirNumeroLivre(dto.numero);
    const mesa = await this.prisma.mesa.create({
      data: dto,
      include: mesaInclude,
    });
    return formatarMesa(mesa);
  }

  async atualizar(id: number, dto: UpdateMesaDto) {
    const atual = await this.buscar(id);
    if (dto.numero !== undefined && dto.numero !== atual.numero) {
      await this.garantirNumeroLivre(dto.numero);
    }
    if (dto.ativa === false && atual.status === StatusMesa.OCUPADA) {
      throw new ConflictException(
        `A mesa ${atual.numero} está ocupada e não pode ser desativada.`,
      );
    }
    const mesa = await this.prisma.mesa.update({
      where: { id },
      data: dto,
      include: mesaInclude,
    });
    return formatarMesa(mesa);
  }

  private async garantirNumeroLivre(numero: number) {
    const existe = await this.prisma.mesa.count({ where: { numero } });
    if (existe) {
      throw new ConflictException(`Já existe uma mesa com o número ${numero}.`);
    }
  }
}
