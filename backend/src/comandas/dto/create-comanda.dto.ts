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

  /**
   * Garçom responsável. Opcional nesta etapa; com JWT passará a ser o
   * usuário autenticado.
   */
  @IsOptional()
  @IsInt()
  @IsPositive()
  garcomId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  nomeCliente?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacao?: string;
}
