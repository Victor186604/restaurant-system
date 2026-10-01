import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PerfilUsuario, StatusComanda } from '../generated/prisma/client.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { travarComanda } from '../common/utils/travar-comanda.js';
import { CreatePedidoDto } from './dto/create-pedido.dto.js';
import { UpdateStatusPedidoDto } from './dto/update-status-pedido.dto.js';
import { ListarPedidosQuery } from './dto/listar-pedidos.query.js';
import {
  CAMPO_DATA_STATUS,
  podeTransicionar,
  STATUS_PEDIDO_COZINHA,
  TRANSICOES_PEDIDO,
} from './pedido-status.js';
import { formatarPedido, pedidoComMesaInclude } from './pedido.mapper.js';

const MOTIVO_COMANDA_BLOQUEADA: Partial<Record<StatusComanda, string>> = {
  [StatusComanda.FECHAMENTO_SOLICITADO]:
    'o fechamento já foi solicitado; não é possível lançar novos pedidos',
  [StatusComanda.FECHADA]: 'a comanda já está fechada',
  [StatusComanda.CANCELADA]: 'a comanda foi cancelada',
};

@Injectable()
export class PedidosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usuarios: UsuariosService,
  ) {}

  async criar(dto: CreatePedidoDto) {
    const pedido = await this.prisma.$transaction(async (tx) => {
      const comanda = await travarComanda(tx, dto.comandaId);
      if (comanda.status !== StatusComanda.ABERTA) {
        throw new ConflictException(
          `Não é possível lançar pedido na comanda ${comanda.id}: ${MOTIVO_COMANDA_BLOQUEADA[comanda.status]}.`,
        );
      }

      if (dto.criadoPorId !== undefined) {
        await this.usuarios.validarResponsavel(
          dto.criadoPorId,
          [PerfilUsuario.GARCOM, PerfilUsuario.GERENTE, PerfilUsuario.ADMIN],
          tx,
        );
      }

      const idsProdutos = [...new Set(dto.itens.map((i) => i.produtoId))];
      const produtos = await tx.produto.findMany({
        where: { id: { in: idsProdutos } },
        include: { categoria: { select: { ativa: true } } },
      });

      const encontrados = new Map(produtos.map((p) => [p.id, p]));
      const inexistentes = idsProdutos.filter((id) => !encontrados.has(id));
      if (inexistentes.length > 0) {
        throw new NotFoundException(
          `Produto(s) não encontrado(s): ${inexistentes.join(', ')}.`,
        );
      }

      const indisponiveis = produtos.filter(
        (p) => !p.ativo || !p.disponivel || !p.categoria.ativa,
      );
      if (indisponiveis.length > 0) {
        throw new UnprocessableEntityException(
          `Produto(s) indisponível(is) no momento: ${indisponiveis
            .map((p) => `${p.nome} (id ${p.id})`)
            .join(', ')}.`,
        );
      }

      return tx.pedido.create({
        data: {
          comandaId: comanda.id,
          criadoPorId: dto.criadoPorId,
          observacao: dto.observacao,
          itens: {
            create: dto.itens.map((item) => ({
              produtoId: item.produtoId,
              quantidade: item.quantidade,
              observacao: item.observacao,
              // Preço congelado no momento do pedido.
              precoUnitario: encontrados.get(item.produtoId)!.preco,
            })),
          },
        },
        include: pedidoComMesaInclude,
      });
    });

    return formatarPedido(pedido);
  }

  async listar(query: ListarPedidosQuery) {
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        status: query.status?.length ? { in: query.status } : undefined,
        comandaId: query.comandaId,
        comanda: query.mesaId ? { mesaId: query.mesaId } : undefined,
      },
      include: pedidoComMesaInclude,
      orderBy: { criadoEm: 'asc' },
    });
    return pedidos.map(formatarPedido);
  }

  /** Fila da cozinha: pedidos PENDENTE e EM_PREPARO, do mais antigo ao mais novo. */
  cozinha() {
    return this.listar({ status: STATUS_PEDIDO_COZINHA });
  }

  async buscar(id: number) {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: pedidoComMesaInclude,
    });
    if (!pedido) throw new NotFoundException(`Pedido ${id} não encontrado.`);
    return formatarPedido(pedido);
  }

  async alterarStatus(id: number, dto: UpdateStatusPedidoDto) {
    const atual = await this.buscar(id);
    const novo = dto.status;

    if (!podeTransicionar(atual.status, novo)) {
      const permitidos = TRANSICOES_PEDIDO[atual.status];
      throw new ConflictException(
        `Transição inválida: o pedido ${id} está ${atual.status} e não pode ir para ${novo}. ` +
          (permitidos.length
            ? `Próximos status permitidos: ${permitidos.join(', ')}.`
            : `${atual.status} é um status final.`),
      );
    }

    const campoData = CAMPO_DATA_STATUS[novo];
    // updateMany com o status atual no filtro = atualização condicional atômica:
    // se outra requisição mudou o pedido no meio do caminho, nada é alterado.
    const { count } = await this.prisma.pedido.updateMany({
      where: { id, status: atual.status },
      data: { status: novo, ...(campoData ? { [campoData]: new Date() } : {}) },
    });
    if (count === 0) {
      throw new ConflictException(
        `O pedido ${id} foi alterado por outra operação. Consulte-o novamente.`,
      );
    }
    return this.buscar(id);
  }
}
