import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  PerfilUsuario,
  Prisma,
  StatusComanda,
  StatusMesa,
  StatusPedido,
} from '../generated/prisma/client.js';
import {
  UsuariosService,
  usuarioResumoSelect,
} from '../usuarios/usuarios.service.js';
import { travarComanda } from '../common/utils/travar-comanda.js';
import { STATUS_COMANDA_ATIVA } from '../mesas/mesas.service.js';
import {
  formatarPedido,
  pedidoInclude,
  somarPedidos,
} from '../pedidos/pedido.mapper.js';
import { STATUS_PEDIDO_EM_ANDAMENTO } from '../pedidos/pedido-status.js';
import { CreateComandaDto } from './dto/create-comanda.dto.js';
import { ListarComandasQuery } from './dto/listar-comandas.query.js';

const comandaDetalheInclude = {
  mesa: { select: { id: true, numero: true, status: true } },
  garcom: { select: usuarioResumoSelect },
  pedidos: { orderBy: { criadoEm: 'asc' }, include: pedidoInclude },
} satisfies Prisma.ComandaInclude;

const comandaResumoInclude = {
  mesa: { select: { id: true, numero: true } },
  garcom: { select: usuarioResumoSelect },
  _count: { select: { pedidos: true } },
} satisfies Prisma.ComandaInclude;

type ComandaDetalhe = Prisma.ComandaGetPayload<{
  include: typeof comandaDetalheInclude;
}>;

const PERFIS_ATENDIMENTO = [
  PerfilUsuario.GARCOM,
  PerfilUsuario.GERENTE,
  PerfilUsuario.ADMIN,
];

@Injectable()
export class ComandasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usuarios: UsuariosService,
  ) {}

  /**
   * Abre uma comanda numa mesa LIVRE e ativa, marcando a mesa como OCUPADA.
   */
  async abrir(dto: CreateComandaDto) {
    const id = await this.prisma.$transaction(async (tx) => {
      if (dto.garcomId !== undefined) {
        await this.usuarios.validarResponsavel(
          dto.garcomId,
          PERFIS_ATENDIMENTO,
          tx,
        );
      }

      const mesa = await tx.mesa.findUnique({ where: { id: dto.mesaId } });
      if (!mesa)
        throw new NotFoundException(`Mesa ${dto.mesaId} não encontrada.`);
      if (!mesa.ativa) {
        throw new UnprocessableEntityException(
          `A mesa ${mesa.numero} está desativada.`,
        );
      }

      // Atualização condicional: só ocupa a mesa se ela ainda estiver LIVRE.
      // Duas aberturas simultâneas na mesma mesa: apenas uma consegue.
      const { count } = await tx.mesa.updateMany({
        where: { id: mesa.id, status: StatusMesa.LIVRE, ativa: true },
        data: { status: StatusMesa.OCUPADA },
      });
      if (count === 0) {
        const ativa = await tx.comanda.findFirst({
          where: { mesaId: mesa.id, status: { in: STATUS_COMANDA_ATIVA } },
          select: { id: true },
        });
        throw new ConflictException(
          `A mesa ${mesa.numero} já está ocupada` +
            (ativa ? ` (comanda ${ativa.id}).` : '.'),
        );
      }

      const comanda = await tx.comanda.create({
        data: {
          mesaId: mesa.id,
          garcomId: dto.garcomId,
          nomeCliente: dto.nomeCliente,
          observacao: dto.observacao,
        },
        select: { id: true },
      });
      return comanda.id;
    });

    return this.buscar(id);
  }

  listar(query: ListarComandasQuery) {
    return this.prisma.comanda.findMany({
      where: {
        status: query.status?.length ? { in: query.status } : undefined,
        mesaId: query.mesaId,
      },
      include: comandaResumoInclude,
      orderBy: { abertaEm: 'desc' },
    });
  }

  async buscar(id: number) {
    const comanda = await this.prisma.comanda.findUnique({
      where: { id },
      include: comandaDetalheInclude,
    });
    if (!comanda) throw new NotFoundException(`Comanda ${id} não encontrada.`);
    return this.formatar(comanda);
  }

  /** Garçom pede a conta: ABERTA → FECHAMENTO_SOLICITADO. */
  async solicitarFechamento(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const comanda = await travarComanda(tx, id);
      if (comanda.status !== StatusComanda.ABERTA) {
        throw new ConflictException(
          `Só é possível solicitar o fechamento de comanda ABERTA (a comanda ${id} está ${comanda.status}).`,
        );
      }
      await tx.comanda.update({
        where: { id },
        data: {
          status: StatusComanda.FECHAMENTO_SOLICITADO,
          fechamentoSolicitadoEm: new Date(),
        },
      });
    });
    return this.buscar(id);
  }

  /**
   * Fecha a comanda: exige que todos os pedidos estejam ENTREGUE ou
   * CANCELADO, congela o total e libera a mesa.
   */
  async fechar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const comanda = await travarComanda(tx, id);
      if (!STATUS_COMANDA_ATIVA.includes(comanda.status)) {
        throw new ConflictException(
          `A comanda ${id} já está ${comanda.status}.`,
        );
      }

      const emAndamento = await tx.pedido.findMany({
        where: { comandaId: id, status: { in: STATUS_PEDIDO_EM_ANDAMENTO } },
        select: { id: true, status: true },
        orderBy: { id: 'asc' },
      });
      if (emAndamento.length > 0) {
        throw new ConflictException(
          `A comanda ${id} tem pedido(s) não entregue(s): ${emAndamento
            .map((p) => `#${p.id} (${p.status})`)
            .join(', ')}. Entregue ou cancele antes de fechar.`,
        );
      }

      const itens = await tx.itemPedido.findMany({
        where: { pedido: { comandaId: id, status: StatusPedido.ENTREGUE } },
        select: { quantidade: true, precoUnitario: true },
      });
      const total = itens.reduce(
        (soma, item) => soma.add(item.precoUnitario.mul(item.quantidade)),
        new Prisma.Decimal(0),
      );

      await tx.comanda.update({
        where: { id },
        data: { status: StatusComanda.FECHADA, fechadaEm: new Date(), total },
      });
      await tx.mesa.update({
        where: { id: comanda.mesaId },
        data: { status: StatusMesa.LIVRE },
      });
    });
    return this.buscar(id);
  }

  /**
   * Cancela uma comanda aberta por engano. Só é permitido se não houver
   * pedidos, ou se todos estiverem CANCELADO. Libera a mesa.
   */
  async cancelar(id: number) {
    await this.prisma.$transaction(async (tx) => {
      const comanda = await travarComanda(tx, id);
      if (!STATUS_COMANDA_ATIVA.includes(comanda.status)) {
        throw new ConflictException(
          `A comanda ${id} já está ${comanda.status}.`,
        );
      }
      const naoCancelados = await tx.pedido.count({
        where: { comandaId: id, status: { not: StatusPedido.CANCELADO } },
      });
      if (naoCancelados > 0) {
        throw new ConflictException(
          `A comanda ${id} possui ${naoCancelados} pedido(s) não cancelado(s); ela deve ser fechada, não cancelada.`,
        );
      }
      await tx.comanda.update({
        where: { id },
        data: { status: StatusComanda.CANCELADA, canceladaEm: new Date() },
      });
      await tx.mesa.update({
        where: { id: comanda.mesaId },
        data: { status: StatusMesa.LIVRE },
      });
    });
    return this.buscar(id);
  }

  /** Acrescenta totais por pedido e um resumo financeiro da comanda. */
  private formatar(comanda: ComandaDetalhe) {
    const pedidos = comanda.pedidos.map(formatarPedido);
    const pedidosPendentesDeEntrega = pedidos.filter((p) =>
      STATUS_PEDIDO_EM_ANDAMENTO.includes(p.status),
    ).length;

    return {
      ...comanda,
      pedidos,
      resumo: {
        quantidadePedidos: pedidos.length,
        pedidosPendentesDeEntrega,
        valorEntregue: somarPedidos(
          pedidos,
          (s) => s === StatusPedido.ENTREGUE,
        ),
        valorEmAndamento: somarPedidos(pedidos, (s) =>
          STATUS_PEDIDO_EM_ANDAMENTO.includes(s),
        ),
        // Valor que a conta terá se tudo o que está em andamento for entregue.
        valorPrevisto: somarPedidos(
          pedidos,
          (s) => s !== StatusPedido.CANCELADO,
        ),
        podeFechar:
          STATUS_COMANDA_ATIVA.includes(comanda.status) &&
          pedidosPendentesDeEntrega === 0,
      },
    };
  }
}
