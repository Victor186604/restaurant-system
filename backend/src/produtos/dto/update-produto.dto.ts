import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateProdutoDto } from './create-produto.dto.js';

export class UpdateProdutoDto extends PartialType(CreateProdutoDto) {
  /** false = remove o produto do cardápio (exclusão lógica). */
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
