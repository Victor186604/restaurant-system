import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { bloquearComanda } from '../comandas/comanda-lock.js';
import { Prisma } from '../generated/prisma/client.js';
import { StatusComanda, StatusPedido } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { QueryPedidosDto } from './dto/query-pedidos.dto.js';
import { apresentarPedido, pedidoInclude } from './pedido.presenter.js';

/** Transições de status permitidas para um pedido. */
export const TRANSICOES_PEDIDO: Record<StatusPedido, StatusPedido[]> = {
  PENDENTE: [StatusPedido.EM_PREPARO, StatusPedido.CANCELADO],
  EM_PREPARO: [StatusPedido.PRONTO],
  PRONTO: [StatusPedido.ENTREGUE],
  ENTREGUE: [],
  CANCELADO: [],
};

/** Pedidos exibidos na fila de preparo da cozinha. */
const STATUS_FILA_COZINHA: StatusPedido[] = [
  StatusPedido.PENDENTE,
  StatusPedido.EM_PREPARO,
];

const pedidoCompletoInclude = {
  ...pedidoInclude,
  comanda: {
    select: {
      id: true,
      status: true,
      mesa: { select: { id: true, numero: true } },
    },
  },
} as const satisfies Prisma.PedidoInclude;

@Injectable()
export class PedidosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryPedidosDto) {
    const pedidos = await this.prisma.pedido.findMany({
      where: { status: query.status, comandaId: query.comandaId },
      include: pedidoCompletoInclude,
      orderBy: { createdAt: 'asc' },
    });
    return pedidos.map(apresentarPedido);
  }

  /** Fila de preparo: pedidos PENDENTE e EM_PREPARO, do mais antigo ao mais novo. */
  async filaCozinha() {
    const pedidos = await this.prisma.pedido.findMany({
      where: { status: { in: STATUS_FILA_COZINHA } },
      include: pedidoCompletoInclude,
      orderBy: { createdAt: 'asc' },
    });
    return pedidos.map(apresentarPedido);
  }

  async findOne(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: pedidoCompletoInclude,
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }
    return apresentarPedido(pedido);
  }

  /** Lança um pedido em uma comanda ABERTA, registrando o preço atual de cada produto. */
  async create(dto: CreatePedidoDto) {
    const pedidoId = await this.prisma.$transaction(async (tx) => {
      const comanda = await bloquearComanda(tx, dto.comandaId);
      if (comanda.status !== StatusComanda.ABERTA) {
        throw new ConflictException(
          `Não é possível lançar pedidos em uma comanda com status ${comanda.status}`,
        );
      }

      const ids = [...new Set(dto.itens.map((item) => item.produtoId))];
      const produtos = await tx.produto.findMany({
        where: { id: { in: ids } },
        select: { id: true, nome: true, preco: true, disponivel: true },
      });
      const porId = new Map(produtos.map((produto) => [produto.id, produto]));

      const inexistentes = ids.filter((id) => !porId.has(id));
      if (inexistentes.length > 0) {
        throw new NotFoundException(
          `Produto(s) não encontrado(s): ${inexistentes.join(', ')}`,
        );
      }
      const indisponiveis = produtos.filter((produto) => !produto.disponivel);
      if (indisponiveis.length > 0) {
        throw new UnprocessableEntityException(
          `Produto(s) indisponível(is): ${indisponiveis.map((p) => p.nome).join(', ')}`,
        );
      }

      const pedido = await tx.pedido.create({
        data: {
          comandaId: comanda.id,
          observacao: dto.observacao,
          itens: {
            create: dto.itens.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              observacao: item.observacao,
              precoUnitario: porId.get(item.produtoId)!.preco,
            })),
          },
        },
      });
      return pedido.id;
    });

    return this.findOne(pedidoId);
  }

  /** Avança o status do pedido respeitando a máquina de estados. */
  async atualizarStatus(id: number, novoStatus: StatusPedido) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!pedido) {
      throw new NotFoundException(`Pedido ${id} não encontrado`);
    }

    const permitidos = TRANSICOES_PEDIDO[pedido.status];
    if (!permitidos.includes(novoStatus)) {
      throw new ConflictException(
        `Transição inválida: ${pedido.status} → ${novoStatus}. ` +
          (permitidos.length > 0
            ? `Permitido(s) a partir de ${pedido.status}: ${permitidos.join(', ')}`
            : `${pedido.status} é um status final`),
      );
    }

    // Atualização condicional: falha se outro cliente alterou o status nesse meio-tempo.
    const { count } = await this.prisma.pedido.updateMany({
      where: { id, status: pedido.status },
      data: { status: novoStatus },
    });
    if (count === 0) {
      throw new ConflictException(
        `O pedido ${id} foi alterado por outra operação. Consulte-o e tente novamente.`,
      );
    }

    return this.findOne(id);
  }
}
