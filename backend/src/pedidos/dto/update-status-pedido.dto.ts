import { IsEnum } from 'class-validator';
import { StatusPedido } from '../../generated/prisma/enums.js';

export class UpdateStatusPedidoDto {
  @IsEnum(StatusPedido)
  status: StatusPedido;
}
