import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { StatusComanda } from '../../generated/prisma/enums.js';
import { QueryArray } from '../../common/utils/query.transform.js';

export class ListarComandasQuery {
  /** Um ou mais status: ?status=ABERTA,FECHAMENTO_SOLICITADO */
  @IsOptional()
  @QueryArray()
  @IsEnum(StatusComanda, { each: true })
  status?: StatusComanda[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  mesaId?: number;
}
