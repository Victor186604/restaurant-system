import { IsEnum, IsOptional } from 'class-validator';
import { StatusMesa } from '../../generated/prisma/enums.js';

export class QueryMesasDto {
  @IsOptional()
  @IsEnum(StatusMesa)
  status?: StatusMesa;
}
