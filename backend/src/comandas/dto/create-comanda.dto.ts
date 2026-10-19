import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateComandaDto {
  @IsInt()
  @IsPositive()
  mesaId: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nomeCliente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
