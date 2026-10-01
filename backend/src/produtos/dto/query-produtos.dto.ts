import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsPositive } from 'class-validator';
import { toBoolean } from '../../common/transformers.js';

export class QueryProdutosDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  categoriaId?: number;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  disponivel?: boolean;
}
