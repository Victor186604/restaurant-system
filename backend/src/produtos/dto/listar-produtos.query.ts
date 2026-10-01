import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsPositive } from 'class-validator';
import { QueryBoolean } from '../../common/utils/query.transform.js';

export class ListarProdutosQuery {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoriaId?: number;

  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  disponivel?: boolean;

  @IsOptional()
  @QueryBoolean()
  @IsBoolean()
  incluirInativos?: boolean;
}
