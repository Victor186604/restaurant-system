import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
} from 'class-validator';

export class AbrirComandaDto {
  @IsInt()
  @IsPositive()
  mesaId: number;

  /** Garçom responsável. Opcional enquanto não houver autenticação. */
  @IsOptional()
  @IsInt()
  @IsPositive()
  usuarioId?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nomeCliente?: string;
}
