import { IsBoolean, IsEnum, IsOptional } from 'class-validator';
import { StatusMesa } from '../../generated/prisma/enums.js';
import { QueryBoolean } from '../../common/utils/query.transform.js';

export class ListarMesasQuery {
  @IsOptional()
  @IsEnum(StatusMesa)
  status?: StatusMesa;

  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  incluirInativas?: boolean;
}
