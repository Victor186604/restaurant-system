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

export class ItemPedidoDto {
  @IsInt()
  @IsPositive()
  produtoId: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantidade: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  observacao?: string;
}

export class CreatePedidoDto {
  @IsInt()
  @IsPositive()
  comandaId: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ItemPedidoDto)
  itens: ItemPedidoDto[];
}
