import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateItemPedidoDto {
  @IsInt()
  @IsPositive()
  produtoId: number;

  @IsInt()
  @Min(1)
  @Max(99)
  quantidade: number;

  /** Ex.: "sem cebola", "ao ponto". */
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observacao?: string;
}

export class CreatePedidoDto {
  @IsInt()
  @IsPositive()
  comandaId: number;

  /**
   * Usuário que lançou o pedido. Opcional nesta etapa; quando a autenticação
   * JWT for adicionada, passará a vir do token e sairá do corpo.
   */
  @IsOptional()
  @IsInt()
  @IsPositive()
  criadoPorId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'O pedido deve ter pelo menos um item.' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => CreateItemPedidoDto)
  itens: CreateItemPedidoDto[];
}
