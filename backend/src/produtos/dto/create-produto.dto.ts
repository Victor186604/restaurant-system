import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

export class CreateProdutoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string;

  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Max(99_999_999.99)
  preco: number;

  @IsOptional()
  @IsBoolean()
  disponivel?: boolean;

  @IsInt()
  @IsPositive()
  categoriaId: number;
}
