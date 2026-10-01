import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { StatusPedido } from '../../generated/prisma/enums.js';

export class QueryPedidosDto {
  @IsOptional()
  @IsEnum(StatusPedido)
  status?: StatusPedido;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  comandaId?: number;
}
