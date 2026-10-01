import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { StatusPedido } from '../../generated/prisma/enums.js';
import { QueryArray } from '../../common/utils/query.transform.js';

export class ListarPedidosQuery {
  /** Um ou mais status: ?status=PRONTO ou ?status=PENDENTE,EM_PREPARO */
  @IsOptional()
  @QueryArray()
  @IsEnum(StatusPedido, { each: true })
  status?: StatusPedido[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  comandaId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  mesaId?: number;
}
