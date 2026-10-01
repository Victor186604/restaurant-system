import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import {
  StatusComanda,
  StatusMesa,
  StatusPedido,
} from '../generated/prisma/enums.js';
import {
  apresentarPedido,
  pedidoInclude,
  somarPedidos,
  STATUS_PEDIDO_EM_ANDAMENTO,
} from '../pedidos/pedido.presenter.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { bloquearComanda } from './comanda-lock.js';
import { AbrirComandaDto } from './dto/abrir-comanda.dto.js';
import { QueryComandasDto } from './dto/query-comandas.dto.js';

const comandaInclude = {
  mesa: { select: { id: true, numero: true, status: true } },
  usuario: { select: { id: true, nome: true, perfil: true } },
  pedidos: { include: pedidoInclude, orderBy: { createdAt: 'asc' } },
} as const satisfies Prisma.ComandaInclude;

type ComandaCompleta = Prisma.ComandaGetPayload<{
  include: typeof comandaInclude;
}>;

@Injectable()
export class ComandasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryComandasDto) {
    const comandas = await this.prisma.comanda.findMany({
      where: { status: query.status, mesaId: query.mesaId },
      include: comandaInclude,
      orderBy: { abertaEm: 'desc' },
    });
    return comandas.map((comanda) => this.apresentar(comanda));
  }

  async findOne(id: number) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { id },
      include: comandaInclude,
    });
    if (!comanda) {
      throw new NotFoundException(`Comanda ${id} não encontrada`);
    }
    return this.apresentar(comanda);
  }

  /** Abre uma comanda para uma mesa LIVRE e marca a mesa como OCUPADA. */
  async abrir(dto: AbrirComandaDto) {
    const comandaId = await this.prisma.$transaction(async (tx) => {
      const mesa = await tx.mesa.findUnique({ where: { id: dto.mesaId } });
      if (!mesa) {
        throw new NotFoundException(`Mesa ${dto.mesaId} não encontrada`);
      }

      if (dto.usuarioId !== undefined) {
        const usuario = await tx.usuario.findUnique({
          where: { id: dto.usuarioId },
          select: { ativo: true },
        });
        if (!usuario) {
          throw new NotFoundException(
            `Usuário ${dto.usuarioId} não encontrado`,
          );
        }
        if (!usuario.ativo) {
          throw new UnprocessableEntityException(
            `Usuário ${dto.usuarioId} está inativo`,
          );
        }
      }

      // Atualização condicional: garante atomicamente que só uma comanda
      // seja aberta por mesa, mesmo com requisições simultâneas.
      const { count } = await tx.mesa.updateMany({
        where: { id: mesa.id, status: StatusMesa.LIVRE },
        data: { status: StatusMesa.OCUPADA },
      });
      if (count === 0) {
        throw new ConflictException(
          `Mesa ${mesa.numero} não está livre (status atual: ${mesa.status})`,
        );
      }

      const comanda = await tx.comanda.create({
        data: {
          mesaId: mesa.id,
          usuarioId: dto.usuarioId,
          nomeCliente: dto.nomeCliente,
        },
      });
      return comanda.id;
    });

    return this.findOne(comandaId);
  }

  /** ABERTA → FECHAMENTO_SOLICITADO. Exige que nenhum pedido esteja em andamento. */
  async solicitarFechamento(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const comanda = await bloquearComanda(tx, id);
      if (comanda.status !== StatusComanda.ABERTA) {
        throw new ConflictException(
          `Só é possível solicitar o fechamento de comandas ABERTA (status atual: ${comanda.status})`,
        );
      }
      await this.garantirPedidosFinalizados(tx, id);

      await tx.comanda.update({
        where: { id },
        data: {
          status: StatusComanda.FECHAMENTO_SOLICITADO,
          fechamentoSolicitadoEm: new Date(),
        },
      });
    });

    return this.findOne(id);
  }

  /** FECHAMENTO_SOLICITADO → FECHADA. Registra o total e libera a mesa. */
  async fechar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const comanda = await bloquearComanda(tx, id);
      if (comanda.status !== StatusComanda.FECHAMENTO_SOLICITADO) {
        throw new ConflictException(
          comanda.status === StatusComanda.ABERTA
            ? 'É necessário solicitar o fechamento antes de fechar a comanda'
            : `Comanda ${id} já está FECHADA`,
        );
      }
      await this.garantirPedidosFinalizados(tx, id);

      const itens = await tx.itemPedido.findMany({
        where: {
          pedido: { comandaId: id, status: { not: StatusPedido.CANCELADO } },
        },
        select: { quantidade: true, precoUnitario: true },
      });
      const total = itens.reduce(
        (soma, item) => soma.add(item.precoUnitario.mul(item.quantidade)),
        new Prisma.Decimal(0),
      );

      await tx.comanda.update({
        where: { id },
        data: { status: StatusComanda.FECHADA, total, fechadaEm: new Date() },
      });
      await tx.mesa.update({
        where: { id: comanda.mesaId },
        data: { status: StatusMesa.LIVRE },
      });
    });

    return this.findOne(id);
  }

  private async garantirPedidosFinalizados(
    tx: Prisma.TransactionClient,
    comandaId: number,
  ) {
    const pendentes = await tx.pedido.findMany({
      where: { comandaId, status: { in: STATUS_PEDIDO_EM_ANDAMENTO } },
      select: { id: true, status: true },
      orderBy: { id: 'asc' },
    });
    if (pendentes.length > 0) {
      const lista = pendentes.map((p) => `#${p.id} (${p.status})`).join(', ');
      throw new ConflictException(
        `A comanda possui pedidos não entregues: ${lista}. Entregue ou cancele-os antes.`,
      );
    }
  }

  private apresentar(comanda: ComandaCompleta) {
    const pedidos = comanda.pedidos.map(apresentarPedido);
    return {
      ...comanda,
      pedidos,
      // Comanda fechada usa o total registrado; as demais exibem o parcial.
      total: comanda.total ?? somarPedidos(pedidos),
    };
  }
}
