import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';
import { StatusComanda } from '../../generated/prisma/enums.js';

export class QueryComandasDto {
  @IsOptional()
  @IsEnum(StatusComanda)
  status?: StatusComanda;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  mesaId?: number;
}
